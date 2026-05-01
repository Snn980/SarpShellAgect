/**
 * @file snippets.js — Hazır kod şablonları
 */

/** @typedef {import('../types/index.js').Snippet} Snippet */

export const DEFAULT_CODE = `using System;
using System.Collections.Generic;
using System.Linq;

namespace MyProgram
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Merhaba, C# Shell!");

            var numbers = new List<int> { 1, 2, 3, 4, 5 };
            int sum = numbers.Sum();

            Console.WriteLine($"Toplam: {sum}");
        }
    }
}`;

export const DARKNET_TEMPLATE = `// Darknet / ONNX .NET entegrasyonu
// dotnet add package Microsoft.ML.OnnxRuntime

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace DarknetDemo
{
    class YoloInference : IDisposable
    {
        private readonly InferenceSession _session;

        public YoloInference(string modelPath)
        {
            _session = new InferenceSession(modelPath);
        }

        public float[] Run(float[] imageData, int width = 640, int height = 640)
        {
            var tensor = new DenseTensor<float>(
                imageData,
                new[] { 1, 3, height, width }
            );

            var inputs = new List<NamedOnnxValue>
            {
                NamedOnnxValue.CreateFromTensor("images", tensor)
            };

            using var results = _session.Run(inputs);
            return results.First().AsEnumerable<float>().ToArray();
        }

        public void Dispose() => _session?.Dispose();

        static void Main()
        {
            Console.WriteLine("Darknet/ONNX Demo - Model hazır.");
        }
    }
}`;

export const MAF_TEMPLATE = `// Microsoft Agent Framework 1.2
// dotnet add package Microsoft.Agents.AI --version 1.2.*
// dotnet add package Microsoft.Agents.Orchestration --version 1.2.*

using System;
using System.Threading.Tasks;
using Microsoft.Agents.AI;
using Microsoft.Agents.Orchestration;

namespace AgentDemo
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // 1. Tek Ajan
            var agent = new AIAgent(
                client: new AnthropicChatClient(
                    apiKey: Environment.GetEnvironmentVariable("ANTHROPIC_KEY") ?? ""
                ),
                name: "CSharpHelper",
                instructions: "Sen bir C# .NET uzman asistanısın."
            );

            string result = await agent.RunAsync("Merhaba!");
            Console.WriteLine(result);

            // 2. Sıralı Workflow
            var workflow = new SequentialWorkflow()
                .AddStep(new AIAgent(client: null!, name: "Analyzer",  instructions: "Kodu analiz et."))
                .AddStep(new AIAgent(client: null!, name: "Optimizer", instructions: "Optimize öner."))
                .AddStep(new AIAgent(client: null!, name: "Reviewer",  instructions: "Güvenlik incele."));

            // string finalResult = await workflow.RunAsync(userCode);
        }
    }
}`;

/** @type {readonly Snippet[]} */
export const SNIPPETS = Object.freeze([
  { label: 'Merhaba Dünya',  category: 'temel',   code: DEFAULT_CODE      },
  { label: 'Darknet/ONNX',   category: 'ml',      code: DARKNET_TEMPLATE  },
  { label: 'MAF Agent',      category: 'agent',   code: MAF_TEMPLATE      },
  {
    label: 'HTTP GET', category: 'network',
    code: `using System;
using System.Net.Http;
using System.Threading.Tasks;

var client = new HttpClient();
string response = await client.GetStringAsync("https://api.example.com/data");
Console.WriteLine(response);`,
  },
  {
    label: 'JSON Parse', category: 'data',
    code: `using System;
using System.Text.Json;

string json = """{"name":"Ali","age":30}""";
JsonDocument doc  = JsonDocument.Parse(json);
string? name = doc.RootElement.GetProperty("name").GetString();
Console.WriteLine(name);`,
  },
  {
    label: 'Async/Await', category: 'async',
    code: `using System;
using System.Net.Http;
using System.Threading.Tasks;

static async Task<string> FetchAsync(string url)
{
    using HttpClient client = new HttpClient();
    return await client.GetStringAsync(url);
}

string result = await FetchAsync("https://example.com");
Console.WriteLine(result);`,
  },
  {
    label: 'LINQ Sorgu', category: 'linq',
    code: `using System;
using System.Linq;
using System.Collections.Generic;

List<int> data = new() { 3, 1, 4, 1, 5, 9, 2, 6 };

IEnumerable<int> result = data
    .Where(x => x > 3)
    .OrderByDescending(x => x)
    .Select(x => x * 2);

foreach (int n in result)
    Console.WriteLine(n);`,
  },
  {
    label: 'Try/Catch', category: 'hata',
    code: `using System;

try
{
    int result = int.Parse("abc");
    Console.WriteLine(result);
}
catch (FormatException ex)
{
    Console.Error.WriteLine($"Format hatası: {ex.Message}");
}
finally
{
    Console.WriteLine("Tamamlandı.");
}`,
  },
]);
