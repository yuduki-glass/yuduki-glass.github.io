# PAPER FLIGHT 3.0 (Unreal Engine 5 PC prototype)
This is a **source-only starter**, not a compiled game or a photorealistic city yet.
## Setup
1. Install Unreal Engine 5.5 and Visual Studio 2022 with Game development with C++.
2. Open PaperFlight3.uproject and generate/build the C++ project.
3. Create a new level. Place a PlayerStart and a FlightPawn actor (or set FlightPawn as the Default Pawn in a GameMode Blueprint).
4. Add SkyAtmosphere, DirectionalLight (Atmosphere Sun Light enabled), SkyLight, VolumetricCloud, ExponentialHeightFog and PostProcessVolume (Infinite Extent).
5. Import licensed photogrammetry/PLATEAU-derived meshes as optimized glTF/FBX assets. Set up World Partition, HLOD, Nanite and Lumen according to the hardware target.
6. Use W/S or Up/Down for pitch and A/D or Left/Right for roll.
## Important
The starter uses a placeholder cone mesh, not a paper-plane asset. It does not include the city, UI, scoring, upgrades, collisions beyond the default pawn sweep, or packaged binaries. These are subsequent development tasks. Existing Three.js browser game remains unchanged.
