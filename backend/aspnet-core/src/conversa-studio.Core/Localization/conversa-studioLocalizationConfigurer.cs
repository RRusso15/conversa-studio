using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace ConversaStudio.Localization;

public static class ConversaStudioLocalizationConfigurer
{
    public static void Configure(ILocalizationConfiguration localizationConfiguration)
    {
        localizationConfiguration.Sources.Add(
            new DictionaryBasedLocalizationSource(ConversaStudioConsts.LocalizationSourceName,
                new XmlEmbeddedFileLocalizationDictionaryProvider(
                    typeof(ConversaStudioLocalizationConfigurer).GetAssembly(),
                    "ConversaStudio.Localization.SourceFiles"
                )
            )
        );
    }
}
