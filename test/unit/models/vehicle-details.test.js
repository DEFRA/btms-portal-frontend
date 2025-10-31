import { mapVehicleDetails } from '../../../src/models/vehicle-details'

test('GMR Vehicle details mapped', () => {
  const relatedImportDeclarationsPayload = {
    goodsVehicleMovements: [
      {
        gmr: {
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [
            "ABC 222",
            "ABC 333"
          ]
        }
      }
    ]
  }

  const actual = mapVehicleDetails(relatedImportDeclarationsPayload)
  const expected = {
    vehicleRegistrationNumber: "ABC 111",
    trailerRegistrationNumbers: [
      "ABC 222",
      "ABC 333"
    ]
  }

  expect(actual).toEqual(expected)
})
