#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CityPrototype.generated.h"
class UInstancedStaticMeshComponent;
UCLASS()
class PAPERFLIGHT3_API ACityPrototype : public AActor
{
 GENERATED_BODY()
public:
 ACityPrototype();
 virtual void OnConstruction(const FTransform& Transform) override;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="City") int32 Seed=2718;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="City",meta=(ClampMin="2",ClampMax="30")) int32 TilesPerSide=12;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="City") float TileSize=3600.f;
 UPROPERTY(VisibleAnywhere) UInstancedStaticMeshComponent* Towers;
 UPROPERTY(VisibleAnywhere) UInstancedStaticMeshComponent* LowRise;
 UPROPERTY(VisibleAnywhere) UInstancedStaticMeshComponent* Streets;
 UPROPERTY(VisibleAnywhere) UInstancedStaticMeshComponent* Parks;
private:
 void AddBox(UInstancedStaticMeshComponent* Component,FVector Center,FVector Dimensions,float Yaw=0.f);
};