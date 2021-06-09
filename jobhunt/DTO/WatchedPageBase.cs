namespace JobHunt.DTO {
    // Abstract base class to allow WatchedPage and WatchedPageDto to easily be equality checked
    public abstract class WatchedPageBase {
        public abstract string Url { get; set; }
        public abstract string? CssSelector { get; set; }
        public abstract string? CssBlacklist { get; set; }

        public override bool Equals(object? obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            WatchedPageBase wp = (WatchedPageBase)obj;
            return this.Url == wp.Url && this.CssSelector == wp.CssSelector && this.CssBlacklist == wp.CssBlacklist;
        }

        public override int GetHashCode()
        {
            return Url.GetHashCode() * 17 + CssSelector?.GetHashCode() ?? 0 * 17 + CssBlacklist?.GetHashCode() ?? 0 * 17;
        }

        public static bool operator == (WatchedPageBase? a, WatchedPageBase? b) {
            if (a is null) {
                if (b is null) {
                    return true;
                }
                return false;
            }

            return a.Equals(b);
        }

        public static bool operator != (WatchedPageBase? a, WatchedPageBase? b) => !(a == b);
    }
}