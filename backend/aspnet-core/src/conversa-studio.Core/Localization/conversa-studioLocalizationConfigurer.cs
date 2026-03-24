using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace conversa-studio.Localization;

public static class conversa-studioLocalizationConfigurer
{
    public static void Configure(ILocalizationConfiguration localizationConfiguration)
    {
        localizationConfiguration.Sources.Add(
            new DictionaryBasedLocalizationSource(conversa-studioConsts.LocalizationSourceName,
                new XmlEmbeddedFileLocalizationDictionaryProvider(
                    typeof(conversa-studioLocalizationConfigurer).GetAssembly(),
                    "conversa-studio.Localization.SourceFiles"
                )
            )
        );
    }
}
