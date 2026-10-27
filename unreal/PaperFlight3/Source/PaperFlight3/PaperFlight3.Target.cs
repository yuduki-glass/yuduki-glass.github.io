using UnrealBuildTool;
using System.Collections.Generic;
public class PaperFlight3Target : TargetRules
{
    public PaperFlight3Target(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("PaperFlight3");
    }
}