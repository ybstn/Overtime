using System;
using System.ComponentModel.DataAnnotations;
namespace Overtime_React.Models
{
    public class AuthenticateRequest
    {
        [Required]
        public string FullName { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
