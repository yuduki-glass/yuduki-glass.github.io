#include "CityPrototype.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "UObject/ConstructorHelpers.h"
ACityPrototype::ACityPrototype()
{
 PrimaryActorTick.bCanEverTick=false;
 USceneComponent* Root=CreateDefaultSubobject<USceneComponent>(TEXT("Root"));RootComponent=Root;
 Towers=CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("Towers"));Towers->SetupAttachment(Root);
 LowRise=CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("LowRise"));LowRise->SetupAttachment(Root);
 Streets=CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("Streets"));Streets->SetupAttachment(Root);
 Parks=CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("Parks"));Parks->SetupAttachment(Root);
 static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
 if(Cube.Succeeded())for(UInstancedStaticMeshComponent* C:{Towers,LowRise,Streets,Parks})C->SetStaticMesh(Cube.Object);
}
void ACityPrototype::AddBox(UInstancedStaticMeshComponent* Component,FVector Center,FVector Dimensions,float Yaw)
{
 // UE basic cube is 100 cm per side.
 Component->AddInstance(FTransform(FRotator(0,Yaw,0),Center,Dimensions/100.f));
}
void ACityPrototype::OnConstruction(const FTransform& Transform)
{
 Super::OnConstruction(Transform);
 for(UInstancedStaticMeshComponent* C:{Towers,LowRise,Streets,Parks})C->ClearInstances();
 FRandomStream Random(Seed);
 const int32 Radius=FMath::Clamp(TilesPerSide,2,30);
 for(int32 Y=-Radius;Y<=Radius;Y++)for(int32 X=-Radius;X<=Radius;X++)
 {
  const float PX=X*TileSize,PY=Y*TileSize;
  const float Curve=FMath::Sin(Y*.31f)*TileSize*.28f+FMath::Sin(Y*.12f)*TileSize*.16f;
  const float CX=PX+Curve;
  const int32 District=(FMath::Abs(X/3)+FMath::Abs(Y/4)+Seed)%7;
  const bool Park=District==5,Waterfront=District==6;
  AddBox(Streets,FVector(CX,PY,0),FVector(TileSize*.16f,TileSize,15));
  AddBox(Streets,FVector(CX,PY,0),FVector(TileSize,TileSize*.11f,15),Random.FRandRange(-12,12));
  if(Park){AddBox(Parks,FVector(CX+TileSize*.25f,PY+TileSize*.23f,8),FVector(TileSize*.52f,TileSize*.5f,12));continue;}
  if(Waterfront&&X>0)continue;
  const int32 Count=District==4?5:District==3?8:12;
  for(int32 I=0;I<Count;I++)
  {
   const float DX=Random.FRandRange(-.43f,.43f)*TileSize;
   const float DY=Random.FRandRange(-.43f,.43f)*TileSize;
   if(FMath::Abs(DX)<TileSize*.11f||FMath::Abs(DY)<TileSize*.09f)continue;
   const bool Tall=District<3&&Random.FRand()>.25f;
   const float W=Random.FRandRange(220,540),D=Random.FRandRange(250,650);
   const float H=Tall?Random.FRandRange(2200,11000):Random.FRandRange(350,2100);
   AddBox(Tall?Towers:LowRise,FVector(CX+DX,PY+DY,H*.5f),FVector(W,D,H),Random.FRandRange(-8,8));
  }
 }
}
