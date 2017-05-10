using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Octokit;
using PReviewer.Core;
using System.Threading;

namespace GitHubBuddyHost
{
    internal class Program
    {
        private static string ErrorLogFile = "error.log";

        public static void Main(string[] args)
        {
            try
            {
                Request data;
                if ((data = Read()) != null)
                {
                    var minVer = new Version(data.min_required_nativeapp_ver);
                    var assemblyVersion = Assembly.GetExecutingAssembly().GetName().Version;
                    if (assemblyVersion < minVer)
                    {
                        var err = $"Incompatible Native Host, minimal version required is {minVer}";
                        WriteError(err);
                        return;
                    }
                    if (string.IsNullOrWhiteSpace(data.token))
                    {
                        WriteError("GitHub token is required, please configure it in the options page of this extension");
                        return;
                    }
                    if (string.IsNullOrWhiteSpace(data.difftool))
                    {
                        WriteError("Difftool path is required, please configure it in the options page of this extension");
                        return;
                    }
                    ProcessMessage(data);
                }
            }
            catch (Exception ex)
            {
                WriteError(ex.ToString());
            }
        }

        private static void WriteError(string err)
        {
            CreateErrorLogFileIfNecessary();
            File.AppendAllText(ErrorLogFile, err);
            Console.Error.WriteLine(err);
            Write("Error", err);
        }

        private static void CreateErrorLogFileIfNecessary()
        {
            if (!File.Exists(ErrorLogFile))
            {
                File.Create(ErrorLogFile);
            }
        }

        [SuppressMessage("ReSharper", "InconsistentNaming")]
        [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
        // ReSharper disable once ClassNeverInstantiated.Local
        private class Request
        {
            public string file_path { get; set; }
            public string difftool { get; set; }
            public string pull_request { get; set; }
            public string token { get; set; }
            public string min_required_nativeapp_ver { get; set; }
            public string arguments { get; set; }
        }

        private static void ProcessMessage(Request req)
        {
            var file = req.file_path;
            var toolPath = req.difftool;
            var prUrl = req.pull_request;
            var token = req.token;
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
            var headCommit = commit ?? pr.Head.Sha;
            var parents = commit != null ? 
                client.Repository.Commit.Get(owner, repo, commit).Result.Parents.Select(x => x.Sha)
                : new List<string> { pr.Base.Sha };
            var pullRequestLocator = new PullRequestLocator()
            {
                PullRequestNumber = prNum,
                Owner = owner,
                Repository = repo
            };
            foreach (var baseCommit in parents)
            {
                var compareResults = client.Repository.Commit.Compare(owner, repo, baseCommit, headCommit).Result;
                var githubFile = compareResults.Files.FirstOrDefault(x => x.Filename == file);

                var fetcher = new DiffContentFetcher(pullRequestLocator, new FileContentPersist(), client,
                    new PatchService());
                var files = fetcher.FetchDiffContent(githubFile, headCommit, baseCommit).Result;
                try
                {
                    var arguments = $"\"{files.Item1}\" \"{files.Item2}\"";
                    if (!string.IsNullOrWhiteSpace(req.arguments))
                    {
                        arguments = req.arguments.Replace("$BASE", files.Item1).Replace("$HEAD", files.Item2);
                    }
                    using (var proc = Process.Start(toolPath, arguments))
                    {
                        proc.WaitForExit();
                        Write("Result", "OK");
                    }
                }
                catch (Exception ex)
                {
                    WriteError($"Failed to launch the difftool\r\n\r\n{ex}");
                    return;
                }
            }
        }

        private static Request Read()
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

            return JsonConvert.DeserializeObject<Request>(new string(buffer));
        }

        private static void Write(JToken messageType, JToken data)
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
