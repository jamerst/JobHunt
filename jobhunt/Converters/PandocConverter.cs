using Medallion.Shell;

namespace JobHunt.Converters;
public static class PandocConverter
{
    public static async Task<(bool, string)> Convert(string from, string to, string input)
    {
        if (!PandocInputFormats.Contains(from))
        {
            throw new InvalidOperationException($"'{from}' is not a supported pandoc input format.");
        }

        if (!PandocOutputFormats.Contains(to))
        {
            throw new InvalidOperationException($"'{to}' is not a supported pandoc output format.");
        }

        using (var command = Command.Run("/usr/bin/pandoc", "-f", from, "-t", to, "--wrap=none"))
        using (var reader = new StringReader(input))
        {
            await command.StandardInput.PipeFromAsync(reader);

            var result = await command.Task;
            if (result.Success)
            {
                return (true, result.StandardOutput);
            }
            else
            {
                string stdErr = result.StandardError;
                string msg;
                if (PandocExitCodes.TryGetValue(result.ExitCode, out string? error))
                {
                    if (!string.IsNullOrEmpty(stdErr))
                    {
                        msg = $"{error}: {stdErr}";
                    }
                    else
                    {
                        msg = error;
                    }
                }
                else
                {
                    if (!string.IsNullOrEmpty(stdErr))
                    {
                        msg = $"Unknown error: {stdErr}";
                    }
                    else
                    {
                        msg = "Unknown error";
                    }
                }
                return (false, msg);
            }
        }
    }

    private static Dictionary<int, string> PandocExitCodes = new Dictionary<int, string>
    {
        { 3, "PandocFailOnWarningError" },
        { 4, "PandocAppError" },
        { 5, "PandocTemplateError" },
        { 6, "PandocOptionError" },
        { 21, "PandocUnknownReaderError" },
        { 22, "PandocUnknownWriterError" },
        { 23, "PandocUnsupportedExtensionError" },
        { 24, "PandocCiteprocError" },
        { 31, "PandocEpubSubdirectoryError" },
        { 43, "PandocPDFError" },
        { 44, "PandocXMLError" },
        { 47, "PandocPDFProgramNotFoundError" },
        { 61, "PandocHttpError" },
        { 62, "PandocShouldNeverHappenError" },
        { 63, "PandocSomeError" },
        { 64, "PandocParseError" },
        { 65, "PandocParsecError" },
        { 66, "PandocMakePDFError" },
        { 67, "PandocSyntaxMapError" },
        { 83, "PandocFilterError" },
        { 91, "PandocMacroLoop" },
        { 92, "PandocUTF8DecodingError" },
        { 93, "PandocIpynbDecodingError" },
        { 94, "PandocUnsupportedCharsetError" },
        { 97, "PandocCouldNotFindDataFileError" },
        { 99, "PandocResourceNotFound" },
    };

    private static HashSet<string> PandocInputFormats = new HashSet<string>
    {
        "bibtex",
        "biblatex",
        "commonmark",
        "commonmark_x",
        "creole",
        "csljson",
        "csv",
        "docbook",
        "docx",
        "dokuwiki",
        "epub",
        "fb2",
        "gfm",
        "haddock",
        "html",
        "ipynb",
        "jats",
        "jira",
        "json",
        "latex",
        "markdown",
        "markdown_mmd",
        "markdown_phpextra",
        "markdown_strict",
        "mediawiki",
        "man",
        "muse",
        "native",
        "odt",
        "opml",
        "org",
        "rst",
        "t2t",
        "textile",
        "tikiwiki",
        "twiki",
        "vimwiki"
    };

    private static HashSet<string> PandocOutputFormats = new HashSet<string>
    {
        "asciidoc",
        "asciidoctor",
        "beamer",
        "bibtex",
        "biblatex",
        "commonmark",
        "commonmark_x",
        "context",
        "csljson",
        "docbook",
        "docbook4",
        "docbook5",
        "docx",
        "dokuwiki",
        "epub",
        "epub3",
        "epub2",
        "fb2",
        "gfm",
        "haddock",
        "html",
        "html5",
        "html4",
        "icml",
        "ipynb",
        "jats_archiving",
        "jats_articleauthoring",
        "jats_publishing",
        "jats",
        "jira",
        "json",
        "latex",
        "man",
        "markdown",
        "markdown_mmd",
        "markdown_phpextra",
        "markdown_strict",
        "mediawiki",
        "ms",
        "muse",
        "native",
        "odt",
        "opml",
        "opendocument",
        "org",
        "pdf",
        "plain",
        "pptx",
        "rst",
        "rtf",
        "texinfo",
        "textile",
        "slideous",
        "slidy",
        "dzslides",
        "revealjs",
        "s5",
        "tei",
        "xwiki",
        "zimwiki"
    };
}