using System.ComponentModel.DataAnnotations;

namespace ConversaStudio.Users.Dto;

public class ChangeUserLanguageDto
{
    [Required]
    public string LanguageName { get; set; }
}