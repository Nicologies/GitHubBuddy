using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Octokit;
using PReviewer.Core;

namespace GitHubBuddyHost
{
    internal class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                JObject data;
                if ((data = Read()) != null)
                {
                    var minVer = new Version(data["min_required_nativeapp_ver"].Value<string>());
                    var assemblyVersion = Assembly.GetExecutingAssembly().GetName().Version;
                    if (assemblyVersion < minVer)
                    {
                        var err = $"Incompatible Native Host, minimal version required is {minVer}";
                        Console.Error.WriteLine(err);
                        Write("Error", err);
                        return;
                    }
                    ProcessMessage(data);
                }
            }
            catch (Exception ex)
            {
                File.WriteAllText("error.log", ex.ToString());
                Console.Error.WriteLine(ex.ToString());
            }
        }

        public static void ProcessMessage(JObject data)
        {
            var file = data["file_path"].Value<string>();
            var toolPath = data["difftool"].Value<string>();
            var prUrl = data["pull_request"].Value<string>();
            var token = data["token"].Value<string>();
            var questionMarkPos = prUrl.IndexOf("?", StringComparison.InvariantCulture);
            if (questionMarkPos > 0)
            {
                prUrl = prUrl.Substring(0, questionMarkPos);
            }

            var prNum = 0;
            string owner = null;
            string repo = null;
            string commit = null;
            var matchPrCommit = Regex.Match(prUrl,
                @"(https|http)://.*?/(?<owner>.*?)/(?<repo>.*?)/pull/(?<pr>\d+)/commits/(?<commit>.*)");
            if (matchPrCommit.Success)
            {
                prNum = int.Parse(matchPrCommit.Groups["pr"].Value);
                owner = matchPrCommit.Groups["owner"].Value;
                repo = matchPrCommit.Groups["repo"].Value;
                commit = matchPrCommit.Groups["commit"].Value;
            }
            var match = Regex.Match(prUrl, @"(https|http)://.*?/(?<owner>.*?)/(?<repo>.*?)/pull/(?<pr>\d+).*");
            if (match.Success)
            {
                prNum = int.Parse(match.Groups["pr"].Value);
                owner = match.Groups["owner"].Value;
                repo = match.Groups["repo"].Value;
            }

            var client = new GitHubClient(new ProductHeaderValue("GitHubBuddy"))
            {
                Credentials = new Credentials(token)
            };

            var pr = client.PullRequest.Get(owner, repo, prNum).Result;
            var compareResults = client.Repository.Commit.Compare(owner, repo, pr.Base.Sha, pr.Head.Sha).Result;
            var githubFile = compareResults.Files.FirstOrDefault(x => x.Filename == file);
            var pullRequestLocator = new PullRequestLocator()
            {
                PullRequestNumber = prNum,
                Owner = owner,
                Repository = repo
            };

            var fetcher = new DiffContentFetcher(pullRequestLocator, new FileContentPersist(), client, new PatchService());
            var files = fetcher.FetchDiffContent(githubFile, pr.Head.Sha, pr.Base.Sha).Result;
            Process.Start(toolPath, $"\"{files.Item1}\" \"{files.Item2}\"");
            Write("Result", "OK");
        }

        public static JObject Read()
        {
            var stdin = Console.OpenStandardInput();

            var lengthBytes = new byte[4];
            stdin.Read(lengthBytes, 0, 4);
            var length = BitConverter.ToInt32(lengthBytes, 0);

            if (length <= 0)
            {
                Console.Error.WriteLine("Invalid length of request");
                return null;
            }

            var buffer = new char[length];
            using (var reader = new StreamReader(stdin))
            {
                while (reader.Peek() >= 0)
                {
                    reader.Read(buffer, 0, buffer.Length);
                }
            }

            return JsonConvert.DeserializeObject<JObject>(new string(buffer));
        }

        public static void Write(JToken messageType, JToken data)
        {
            var json = new JObject {["data"] = data, ["msgType"] = messageType};

            var bytes = System.Text.Encoding.UTF8.GetBytes(json.ToString(Formatting.None));

            var stdout = Console.OpenStandardOutput();
            stdout.WriteByte((byte) ((bytes.Length >> 0) & 0xFF));
            stdout.WriteByte((byte) ((bytes.Length >> 8) & 0xFF));
            stdout.WriteByte((byte) ((bytes.Length >> 16) & 0xFF));
            stdout.WriteByte((byte) ((bytes.Length >> 24) & 0xFF));
            stdout.Write(bytes, 0, bytes.Length);
            stdout.Flush();
        }
    }
}
