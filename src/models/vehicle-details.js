export const mapVehicleDetails = ({ goodsVehicleMovements }) => {
  return {
    vehicleRegistrationNumber: goodsVehicleMovements[0]?.gmr?.vehicleRegistrationNumber,
    trailerRegistrationNumbers: goodsVehicleMovements[0]?.gmr?.trailerRegistrationNums
  }
}
