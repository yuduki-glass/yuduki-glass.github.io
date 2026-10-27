#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "FlightPawn.generated.h"
class UStaticMeshComponent;
class USpringArmComponent;
class UCameraComponent;
UCLASS()
class PAPERFLIGHT3_API AFlightPawn : public APawn
{
 GENERATED_BODY()
public:
 AFlightPawn();
 virtual void Tick(float DeltaSeconds) override;
 virtual void SetupPlayerInputComponent(UInputComponent* Input) override;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly) UStaticMeshComponent* Aircraft;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly) USpringArmComponent* CameraBoom;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly) UCameraComponent* Camera;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Flight") float Speed=2200.f;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Flight") float Lift=0.f;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Flight") float Crosswind=0.f;
 UPROPERTY(BlueprintReadOnly, Category="Flight") float Distance=0.f;
private:
 float RollInput=0.f;
 float PitchInput=0.f;
 void Roll(float Value);
 void Pitch(float Value);
};