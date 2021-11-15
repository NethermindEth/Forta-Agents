import { MARKET1, MARKET2 } from "./utils"
export const generateMockBuilder = () => 
    class mockContract {
        
        public methods = {
            getAllMarkets: this.getAllMarkets,
        }

        constructor(){
        }

        private getAllMarkets() {
            return {call: () => [MARKET1, MARKET2]}
        }
    }