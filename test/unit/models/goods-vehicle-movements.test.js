import { mapGoodsVehicleMovements } from '../../../src/models/goods-vehicle-movements'

const mockMetricCounter = jest.fn()

jest.mock('../../../src/utils/metrics.js', () => ({
  metricsCounter: (...args) => mockMetricCounter(...args),
  METRIC_NAMES: jest.requireActual('../../../src/utils/metrics.js').METRIC_NAMES
}))

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

  const actual = mapGoodsVehicleMovements(relatedImportDeclarationsPayload)
  const expected = {
    vehicleRegistrationNumber: "ABC 111",
    trailerRegistrationNumbers: [
      "ABC 222",
      "ABC 333"
    ],
    linkedCustomsDeclarations: [],
    mrnCounts: {
      known: 0,
      unknown: 0
    }
  }

  expect(actual).toEqual(expected)
})

test('Throws exception if GMR data is not returned', () => {
  const relatedImportDeclarationsPayload = {
    goodsVehicleMovements: [
      {
      }
    ]
  }

  expect(() => { mapGoodsVehicleMovements(relatedImportDeclarationsPayload) }).toThrow('Invalid GMR returned')
})

test('Maps GMR Customs Declaration', () => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [
      {
        movementReferenceNumber: "25GB00000000000001",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  checkCode: "H224",
                  decisionCode: "X00"
                }
              ]
            }
          ]
        },
        finalisation: null
      }
    ],
    goodsVehicleMovements: [
      {
        gmr: {
          id: "GMRA00000AB1",
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [
            "ABC 222",
            "ABC 333"
          ],
          declarations: {
            customs: [
              {
                id: "25GB00000000000001"
              },
              {
                id: "25GB00000000000002"
              }
            ]
          }
        }
      }
    ]
  }

  const actual = mapGoodsVehicleMovements(relatedImportDeclarationsPayload)
  expect(actual).toEqual({
    vehicleRegistrationNumber: "ABC 111",
    trailerRegistrationNumbers: [
      "ABC 222",
      "ABC 333"
    ],
    linkedCustomsDeclarations: [
      {
        isKnownMrn: true,
        mrn: "25GB00000000000001",
        knownMrnLink: '/search-result?searchTerm=25GB00000000000001',
        cdsStatus: "In progress",
        btmsDecision: "Refuse - IUU not compliant",
        finalState: undefined
      },
      {
        isKnownMrn: false,
        mrn: "25GB00000000000002",
        knownMrnLink: undefined,
        cdsStatus: "Unknown",
        btmsDecision: "Unknown",
        finalState: undefined
      }
    ],
    mrnCounts: {
      known: 1,
      unknown: 1
    }
  })
})

test.each([
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E03'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Data Error - Unexpected data - transit, transhipment or specific warehouse'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N01'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Not acceptable'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N02'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Destroy'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N03'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Transform'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N04'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Re-export or re-dispatch'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N05'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Use for other purposes'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N06'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Refused'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'N07'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - Not acceptable'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'X00'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Refuse - IUU not compliant'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E70'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - CHED cannot be found'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E71'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - CHED cancelled'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E72'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - CHED replaced'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E73'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - CHED deleted'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E75'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - Split consignment'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E87'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - Selected for HMI GMS inspection'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E84'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - Incorrect CHED type'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E99'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'No match - Unknown error'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'H01'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - Decision not given'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'H02'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - To be inspected'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E88'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - Awaiting IPAFFS update'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E74'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - Partially rejected'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E85'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - PHSI decision not provided'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'E86'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Hold - HMI decision not provided'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C02'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - No inspection required'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C03'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - Inspection complete'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C05'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - Inspection complete temporary admission'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C06'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - Inspection complete T5 procedure'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C07'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - IUU inspection complete'
  },
  {
    item1: {
      checkCode: 'H224',
      decisionCode: 'C08'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: 'Release - IUU inspection not applicable'
  },
  {
    item1: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    item2: {
      checkCode: 'H222',
      decisionCode: 'X00'
    },
    expectedCdsStatus: 'In progress - Awaiting trader',
    expectedBtmsDecision: undefined
  }
])('Maps GMR Customs Declaration BTMS Decision in order', (options) => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [
      {
        movementReferenceNumber: "25GB00000000000001",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  checkCode: options.item1.checkCode,
                  decisionCode: options.item1.decisionCode
                }
              ]
            },
            {
              checks: [
                {
                  checkCode: options.item2.checkCode,
                  decisionCode: options.item2.decisionCode
                }
              ]
            }
          ],
          results: [
            {
              checkCode: options.item1.checkCode,
              internalDecisionCode: options.item1.decisionCode
            },
            {
              checkCode: options.item2.checkCode,
              internalDecisionCode: options.item2.decisionCode
            }
          ]
        },
        finalisation: null
      }
    ],
    goodsVehicleMovements: [
      {
        gmr: {
          id: "GMRA00000AB1",
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [
            "ABC 222",
            "ABC 333"
          ],
          declarations: {
            customs: [
              {
                id: "25GB00000000000001"
              }
            ]
          }
        }
      }
    ]
  }

  const actual = mapGoodsVehicleMovements(relatedImportDeclarationsPayload)
  expect(actual).toEqual({
    vehicleRegistrationNumber: "ABC 111",
    trailerRegistrationNumbers: [
      "ABC 222",
      "ABC 333"
    ],
    linkedCustomsDeclarations: [
      {
        isKnownMrn: true,
        mrn: "25GB00000000000001",
        knownMrnLink: '/search-result?searchTerm=25GB00000000000001',
        cdsStatus: options.expectedCdsStatus,
        btmsDecision: options.expectedBtmsDecision,
        finalState: undefined
      }
    ],
    mrnCounts: {
      known: 1,
      unknown: 0
    }
  })
})

test('Linked Customs Declarations are ordered by CDS Status Priority', () => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [
      {
        movementReferenceNumber: "25GB00000000000001",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H224",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H224",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: null
      },
      {
        movementReferenceNumber: "25GB00000000000002",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: {
          isManualRelease: true
        }
      },
      {
        movementReferenceNumber: "25GB00000000000003",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: {
          isManualRelease: false,
          finalState: 0
        }
      },
      {
        movementReferenceNumber: "25GB00000000000005",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "H01"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "H01"
            }
          ]
        },
        finalisation: null
      },
      {
        movementReferenceNumber: "25GB00000000000006",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "C01"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "C01"
            }
          ]
        },
        finalisation: null
      },
      {
        movementReferenceNumber: "25GB00000000000007",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: null
      },
      {
        movementReferenceNumber: "25GB00000000000008",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: {
          isManualRelease: true
        }
      },
      {
        movementReferenceNumber: "25GB00000000000010",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  itemNumber: 1,
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              itemNumber: 1,
              checkCode: "H222",
              internalDecisionCode: "X00"
            }
          ]
        },
        finalisation: {
          isManualRelease: false,
          finalState: 1
        }
      }
    ],
    goodsVehicleMovements: [
      {
        gmr: {
          id: "GMRA00000AB1",
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [
            "ABC 222",
            "ABC 333"
          ],
          declarations: {
            transits: [
              {
                id: "25GB00000000000009" // Unknown
              }
            ],
            customs: [
              {
                id: "25GB00000000000001" // In progress
              },
              {
                id: "25GB00000000000002" // Finalised - Manually released
              },
              {
                id: "25GB00000000000003" // Finalised - Released
              },
              {
                id: "25GB00000000000004" // Unknown
              },
              {
                id: "25GB00000000000005" // In progress - Awaiting IPAFFS
              },
              {
                id: "25GB00000000000006" // In progress - Awaiting CDS
              },
              {
                id: "25GB00000000000007" // In progress - Awaiting trader
              },
              {
                id: "25GB00000000000008" // Finalised - Manually released
              },
              {
                id: "25GB00000000000010" // Finalised - Cancelled after arrival
              }
            ]
          }
        }
      }
    ]
  }

  const actual = mapGoodsVehicleMovements(relatedImportDeclarationsPayload)

  expect(actual.linkedCustomsDeclarations[0].cdsStatus).toBe('In progress - Awaiting trader')
  expect(actual.linkedCustomsDeclarations[1].cdsStatus).toBe('In progress - Awaiting IPAFFS')
  expect(actual.linkedCustomsDeclarations[2].cdsStatus).toBe('In progress - Awaiting CDS')
  expect(actual.linkedCustomsDeclarations[3].cdsStatus).toBe('In progress')
  expect(actual.linkedCustomsDeclarations[4].cdsStatus).toBe('Finalised - Manually released')
  expect(actual.linkedCustomsDeclarations[5].cdsStatus).toBe('Finalised - Manually released')
  expect(actual.linkedCustomsDeclarations[6].cdsStatus).toBe('Finalised - Released')
  expect(actual.linkedCustomsDeclarations[7].cdsStatus).toBe('Unknown')
  expect(actual.linkedCustomsDeclarations[8].cdsStatus).toBe('Unknown')
  expect(actual.linkedCustomsDeclarations[9].cdsStatus).toBe('Finalised - Cancelled after arrival')
})
