import { mapResourceEvents } from '../../../src/models/resource-events.js'

test('maps Clearance Request Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceRequest',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": "2025-01-01T09:00:00.000Z",\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105",\n'
      + '            "documents": [\n'
      + '              {\n'
      + '                "documentCode": "C640",\n'
      + '                "documentReference": "CHEDA.GB.2025.0000001"\n'
      + '              }\n'
      + '            ],\n'
      + '            "checks": [{\n'
      + '              "checkCode": "H221"\n'
      + '            }]\n'
      + '          }\n'
      + '        ]\n'
      + '      }\n'
      + '    }\n'
      + '  }',
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "commodities": [
      {
        "checks": [
          {
            "authority": "APHA",
            "checkCode": "H221",
            "chedReference": "CHEDA.GB.2025.0000001"
          }
        ],
        "commodityCode": "1601009105",
        "description": "Horse Re-entry",
        "itemNumber": 1
      }
    ],
    "created": "01 January 2025, 09:00:00",
    "eventTitle": "CDS decision request",
    "eventType": "CdsDecisionRequest",
    "source": "CDS to BTMS",
    "version": 1
  })
})

test('maps Decision Notification Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "decisionNumber": 1,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E70"\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": "2025-01-01T09:00:00.000Z"\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "commodities": [
      {
        "commodityCode": "1601009105",
        "decisions": [
          {
            "authority": "APHA",
            "checkCode": "H221",
            "chedReference": "CHEDA.GB.2025.0000001",
            "decision": "No match - CHED cannot be found",
            "decisionCode": "X00"
          }
        ],
        "description": "Horse Re-entry",
        "itemNumber": 1
      }
    ],
    "created": "01 January 2025, 09:00:00",
    "eventTitle": "BTMS decision",
    "eventType": "BtmsDecision",
    "source": "BTMS to CDS",
    "status": "Finalised - Manually released",
    "version": 1
  })
})

test('maps Decision Notification Resource Event with unknown internal decision code', () => {
  const resourceEvents = [{
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "decisionNumber": 1,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E1000"\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": "2025-01-01T09:00:00.000Z"\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "commodities": [
      {
        "commodityCode": "1601009105",
        "decisions": [
          {
            "authority": "APHA",
            "checkCode": "H221",
            "chedReference": "CHEDA.GB.2025.0000001",
            "decision": "No match",
            "decisionCode": "X00"
          }
        ],
        "description": "Horse Re-entry",
        "itemNumber": 1
      }
    ],
    "created": "01 January 2025, 09:00:00",
    "eventTitle": "BTMS decision",
    "eventType": "BtmsDecision",
    "source": "BTMS to CDS",
    "status": "Finalised - Manually released",
    "version": 1
  })
})

test('maps Finalisation Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'CustomsDeclaration',
    subResourceType: 'Finalisation',
    message: '{\n'
      + '    "resource": {\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true,\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": "2025-01-01T09:00:00.000Z"\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "created": "01 January 2025, 09:00:00",
    "eventTitle": "CDS finalisation",
    "eventType": "CdsFinalisation",
    "source": "CDS to BTMS",
    "status": "Finalised - Manually released",
    "version": 1
  })
})

test('maps CDS Error Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ExternalError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "externalErrors": [\n'
      + '        {\n'
      + '          "messageSentAt": "2025-01-01T09:00:00.000Z",\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "HMRCVAL101",\n'
      + '              "message": "An error notification sent by CDS into BTMS"\n'
      + '            }\n'
      + '          ]\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "created": "01 January 2025, 09:00:00",
    "errors": [
      {
        "created": "01 January 2025, 09:00:00",
        "errorCode": "HMRCVAL101",
        "errorMessage": "An error notification sent by CDS into BTMS"
      }
    ],
    "eventTitle": "CDS processing error",
    "eventType": "CdsError",
    "source": "CDS to BTMS"
  })
})

test('maps Processing Error Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'ProcessingError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "processingErrors": [\n'
      + '        {\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "ALVSVAL303",\n'
      + '              "message": "An error detected in the Imports Processor"\n'
      + '            }\n'
      + '          ],\n'
      + '          "externalVersion": 1,\n'
      + '          "created": "2025-01-01T09:00:00.000Z"\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "created": "01 January 2025, 09:00:00",
    "errors": [
      {
        "created": "01 January 2025, 09:00:00",
        "errorCode": "ALVSVAL303",
        "errorMessage": "An error detected in the Imports Processor"
      }
    ],
    "eventTitle": "BTMS processing error",
    "eventType": "BtmsError",
    "source": "BTMS to CDS"
  })
})

test('maps Import Pre Notification Resource Event', () => {
  const resourceEvents = [{
    resourceType: 'ImportPreNotification',
    message: '{\n'
      + '    "resource": {\n'
      + '      "importPreNotification": {\n'
      + '        "referenceNumber": "CHEDA.GB.2025.0000001",\n'
      + '        "status": "VALIDATED",\n'
      + '        "decisionDate": "2025-01-01T09:00:00.000Z",\n'
      + '        "updatedSource": "2025-01-01T09:00:00.000Z",\n'
      + '        "partTwo": {\n'
      + '          "decision": {\n'
      + '            "decision": "Horse Re-entry"\n'
      + '          }\n'
      + '        }\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  }]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "created": "01 January 2025, 09:00:00",
    "decision": "Horse Re-entry",
    "eventTitle": "CHEDA.GB.2025.0000001",
    "eventType": "Ched",
    "source": "IPAFFS to BTMS",
    "status": "VALIDATED"
  })
})

test.each([
  {
    resourceType: 'ImportPreNotification',
    message: null
  },
  {
    resourceType: 'ImportPreNotification'
  }
])('skips resource event if message not present', (resourceEvent) => {
  const resourceEvents = [resourceEvent]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(0)
})

test('skips resource event if unable to parse and map', () => {
  const resourceEvents = [
    {
      resourceType: 'ImportPreNotification',
      message: '{\n'
        + '    "resource": {\n'
        + '      "importPreNotification": {\n'
        + '        "referenceNumber": "CHEDA.GB.2025.0000001",\n'
        + '        "status": "VALIDATED",\n'
        + '        "decisionDate": "2025-01-01T09:00:00.000Z",\n'
        + '        "updatedSource": "2025-01-01T09:00:00.000Z",\n'
        + '        "partTwo": {\n'
        + '          "decision": {\n'
        + '            "decision": "Horse Re-entry"\n'
        + '          }\n'
        + '        }\n'
        + '      }\n'
        + '    }\n'
        + '  }'
    },
    {
      resourceType: 'ImportPreNotification',
      message: 'invalid json'
    }
  ]

  const result = mapResourceEvents('24GB0Z8WEJ9ZBTL73A', resourceEvents)

  expect(result.length).toBe(1)
  expect(result[0]).toEqual({
    "created": "01 January 2025, 09:00:00",
    "decision": "Horse Re-entry",
    "eventTitle": "CHEDA.GB.2025.0000001",
    "eventType": "Ched",
    "source": "IPAFFS to BTMS",
    "status": "VALIDATED"
  })
})
