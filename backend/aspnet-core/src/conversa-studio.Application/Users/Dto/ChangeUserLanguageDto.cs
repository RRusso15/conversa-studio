using System.ComponentModel.DataAnnotations;

namespace conversa-studio.Users.Dto;

public class ChangeUserLanguageDto
{
    [Required]
    public string LanguageName { get; set; }
}