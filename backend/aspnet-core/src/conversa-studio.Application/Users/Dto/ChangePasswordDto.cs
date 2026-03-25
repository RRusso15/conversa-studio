using System.ComponentModel.DataAnnotations;

namespace ConversaStudio.Users.Dto;

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; }

    [Required]
    public string NewPassword { get; set; }
}
