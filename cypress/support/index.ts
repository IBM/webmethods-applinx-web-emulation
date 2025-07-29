
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      login: () => void;
      multipleEnterTyping: (number: number) => void;
      multipleEnterTypingFocused: (number: number) => void;
      screenNameAssert: (screenName: string) => void;
      flexFieldClassAssert: (instanceNumber: number, className: string) => void;
      flexFieldSpanAssert: (instanceNumber: number, string: string) => void;
      generalSpanAssert: (attributeName: string, string: string) => void;
      attributeAssert: (attributeName: string, attributeType: string, attributeValue: string) => void;
      locationByIdAssert: (ID: string, row: string, column: string) => void;
      IdOfFocusedAssert: (ID: string) => void;
      locationOfFocusedAssert: (row: string, column: string) => void;
      typeShortcut: (string: string) => void;
      typeUpArrow: () => void;
      typeRightArrow: () => void;
      typeDownArrow: () => void;
      typeLeftArrow: () => void;
      typeWithTab: (string: string) => void;
      typeWithShiftTab: (string: string) => void;
    }
  }
}