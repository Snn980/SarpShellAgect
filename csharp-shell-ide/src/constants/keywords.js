/**
 * @file keywords.js — C# söz dizimi vurgulama için anahtar kelimeler
 */

/** @type {readonly string[]} */
export const CSHARP_KEYWORDS = Object.freeze([
  'using','namespace','class','struct','interface','enum','record',
  'static','void','string','int','bool','long','double','float','decimal',
  'byte','char','object','var','dynamic',
  'new','return','if','else','for','foreach','while','do','switch','case',
  'break','continue','default','goto',
  'public','private','protected','internal','sealed','abstract','partial',
  'override','virtual','readonly','const','extern',
  'null','true','false','this','base',
  'try','catch','finally','throw','when',
  'async','await','Task','ValueTask',
  'List','Dictionary','HashSet','Queue','Stack','IEnumerable','IList',
  'Console','Math','String','Convert','Array','Enumerable',
  'in','out','ref','params','typeof','sizeof','nameof','is','as',
  'checked','unchecked','unsafe','fixed','lock','event','delegate',
]);

/** @type {readonly string[]} */
export const CSHARP_TYPES = Object.freeze([
  'Program','Exception','ArgumentException','InvalidOperationException',
  'NotImplementedException','NullReferenceException','IndexOutOfRangeException',
  'HttpClient','HttpResponse','HttpRequest','JsonDocument','JsonElement',
  'Stream','FileStream','StreamReader','StreamWriter',
  'Thread','Task','CancellationToken','CancellationTokenSource',
  'StringBuilder','Regex','DateTime','TimeSpan','Guid',
]);
