using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class Alert {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public bool Read { get; set; }
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Message { get; set;}
        public string? Url { get; set; }
    }
}