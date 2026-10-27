using UnrealBuildTool;
using System.Collections.Generic;
public class PaperFlight3EditorTarget : TargetRules
{
    public PaperFlight3EditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("PaperFlight3");
    }
}