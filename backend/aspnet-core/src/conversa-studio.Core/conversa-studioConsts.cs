using conversa-studio.Debugging;

namespace conversa-studio;

public class conversa-studioConsts
{
    public const string LocalizationSourceName = "conversa-studio";

    public const string ConnectionStringName = "Default";

    public const bool MultiTenancyEnabled = true;


    /// <summary>
    /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
    /// </summary>
    public static readonly string DefaultPassPhrase =
        DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "3b27609e3dbd461bb33721f64bce356e";
}
