#include "FlightPawn.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "UObject/ConstructorHelpers.h"
AFlightPawn::AFlightPawn()
{
 PrimaryActorTick.bCanEverTick=true;
 AutoPossessPlayer=EAutoReceiveInput::Player0;
 Aircraft=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PaperPlane"));
 RootComponent=Aircraft;
 Aircraft->SetCollisionProfileName(TEXT("Pawn"));
 static ConstructorHelpers::FObjectFinder<UStaticMesh> PlaneMesh(TEXT("/Engine/BasicShapes/Cone.Cone"));
 if(PlaneMesh.Succeeded()) Aircraft->SetStaticMesh(PlaneMesh.Object);
 Aircraft->SetWorldScale3D(FVector(1.2f,2.2f,.09f));
 CameraBoom=CreateDefaultSubobject<USpringArmComponent>(TEXT("ChaseArm"));
 CameraBoom->SetupAttachment(RootComponent);
 CameraBoom->TargetArmLength=480.f;
 CameraBoom->SetRelativeRotation(FRotator(-10.f,0.f,0.f));
 CameraBoom->bEnableCameraLag=true;
 CameraBoom->CameraLagSpeed=5.f;
 Camera=CreateDefaultSubobject<UCameraComponent>(TEXT("ChaseCamera"));
 Camera->SetupAttachment(CameraBoom);
}
void AFlightPawn::Roll(float Value){RollInput=Value;}
void AFlightPawn::Pitch(float Value){PitchInput=Value;}
void AFlightPawn::SetupPlayerInputComponent(UInputComponent* Input)
{
 Super::SetupPlayerInputComponent(Input);
 Input->BindAxis(TEXT("Roll"),this,&AFlightPawn::Roll);
 Input->BindAxis(TEXT("Pitch"),this,&AFlightPawn::Pitch);
}
void AFlightPawn::Tick(float Dt)
{
 Super::Tick(Dt);
 const float Bank=FMath::Clamp(RollInput,-1.f,1.f);
 const float PitchAmount=FMath::Clamp(PitchInput,-1.f,1.f);
 AddActorLocalRotation(FRotator(PitchAmount*26.f*Dt,Bank*23.f*Dt,-Bank*43.f*Dt));
 const FVector Forward=GetActorForwardVector();
 const FVector Movement=Forward*Speed*Dt+FVector(0.f,Crosswind*Dt,(Lift-140.f)*Dt);
 FHitResult Hit;
 AddActorWorldOffset(Movement,true,&Hit);
 Distance+=Movement.Size()/100.f;
 if(Hit.IsValidBlockingHit()) Speed=FMath::Max(0.f,Speed-800.f*Dt);
 Speed=FMath::Clamp(Speed+(-Forward.Z*160.f-12.f)*Dt,700.f,4300.f);
}
