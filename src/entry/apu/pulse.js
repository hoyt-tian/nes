import {LengthTable} from '../../constants'

const DutyTable = [
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 1, 1, 1],
]

export default class Pulse {
    constructor(ram, addr) {
        this.ram = ram
        this.addr = addr
        

        this.lengthCounter = 0
        this.period = 0
        this.sequencer = 0
        this.timerRemain = 0

        this.envelopeRemain = 0
        this.envelopeStartFlag = false
        this.envelopeDecayLevel = 0

        this.sweepReloadFlag = false
        this.sweepReamin = 0
    }

    write(addr, val) {
        if (addr == this.addr) {
            this.ram[this.addr] = val
        } else if (addr == this.addr + 1) {
            this.ram[this.addr+1] = val
            this.sweepReloadFlag = true
        } else if (addr == this.addr + 2) {
            this.ram[addr] = val
            this.period = this.timer
        } else if (addr == this.addr + 3) {
            this.ram[addr] = val            
            this.sequencer = 0
            this.envelopeStartFlag = true
            this.lengthCounter = LengthTable[this.lengthCounterLoad]
        }
    }

    execute() {
        if (this.lengthCounter == 0 || this.period < 8 || this.period > 0x7FF || DutyTable[this.duty][this.sequencer]==0) {
            return 0
        }

        if (this.CVEFlag) {
            return this.dividerPeriod & 0xF
        } else {
            return this.envelopeDecayLevel & 0xF
        }
    }

    updateTimer() {
        if (this.timerRemain) {
            this.timerRemain--
        } else {
            this.timerRemain = this.period
            this.sequencer = ( this.sequencer + 1 ) % 8
        }
    }

    doEnvelope() {
        if( this.envelopeStartFlag ) {
            this.envelopeRemain = this.dividerPeriod
            this.envelopeDecayLevel = 0xF
            this.envelopeStartFlag = false
            return
        }

        if (this.envelopeRemain) {
            this.envelopeRemain--
        } else {
            this.envelopeRemain = this.dividerPeriod

            if (this.envelopeDecayLevel) {
                this.envelopeDecayLevel--
            } else if (this.envelopeLoopFlag){
                this.envelopeDecayLevel = 0xF
            }
        }
    }

    updateLength() {
        if (!this.CVEFlag && this.lengthCounter) {
            this.lengthCounter--
        }
    }

    updateSweep() {
        if (this.sweepReamin == 0 && this.sweepEnable && this.sweepShiftCounter && this.period >= 8 && this.period <= 0x7FF) {
            let val = this.period >> this.sweepShiftCounter

            if (this.sweepNegate) {
                this.period -= val

                if (this.addr == 0x4000) {
                    this.period--
                }
            } else {
                this.period += val
            }
        }

        if (this.sweepReamin === 0 ) {
            this.sweepReamin = this.sweepDivider
            
        } else {
            this.sweepReamin--
        }
    }

    get duty() {
        return (this.ram[this.addr] >> 6) & 0x3
    }

    get envelopeLoopFlag() {
        return (this.ram[this.addr] >> 5) & 0x1
    }

    // constant volume or Envelope
    get CVEFlag() {
        return (this.ram[this.addr] >> 4) & 0x01
    }

    get dividerPeriod() {
        return this.ram[this.addr] & 0x0F
    }

    get frequence() {
        return 1789773 / ((this.timer+1)<<4)
    }

    get sweep() {
        return this.ram[this.addr + 1]
    }

    set sweepEnable(val) {
        if( val ){
            return this.sweep = this.sweep | 0x80
        } else {
            return this.sweep = this.sweep & (~0x80)
        }
    }

    get sweepEnable() {
        return (this.sweep >> 7) & 0x01
    }

    get sweepDivider() {
        return (this.sweep >> 4) & 0x07
    }

    get sweepNegate() {
        return (this.sweep>>3) & 0x01
    }

    get sweepShiftCounter() {
        return this.sweep & 0x07
    }

    get timerLow() {
        return this.ram[this.addr + 2]
    }

    get timerHigh() {
        return this.ram[this.addr + 3] & 0x7
    }

    get timer() {
        return ( this.timerHigh << 8 ) | this.timerLow
    }

    get lengthCounterLoad() {
        return this.ram[this.addr + 3] >> 3
    }

}