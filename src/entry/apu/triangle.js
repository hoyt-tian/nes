import getBit from '../../util/bit'
import {LengthTable} from '../../constants'

const SequenceTab = [
    15, 14, 13, 12, 11, 10,  9,  8,
     7,  6,  5,  4,  3,  2,  1,  0,
     0,  1,  2,  3,  4,  5,  6,  7,
     8,  9, 10, 11, 12, 13, 14, 15
]

export default class Triangle{
    constructor(ram, addr) {
        this.ram = ram
        this.addr = addr

        this.lengthCounter = 0
        this.sequencer = 0

        this.timerRemain = 0

        this.linearRemain = 0
        this.linearReloadFlag = false
    }

    execute() {
        if(this.lengthCounter === 0 ||
            this.linearRemain === 0 || this.timer < 2)
          return 0;    
        return SequenceTab[this.sequencer] & 0xF;
    }

    doEnvelope() {
        if(this.linearReloadFlag === true)
            this.linearRemain= this.linearCounterLoad
        else if(this.linearRemain)
            this.linearRemain--
  
        if(!this.linerCounterControl)
            this.linearReloadFlag = false
    }

    updateTimer() {
        if (this.timerRemain) {
            this.timerRemain--
        } else {
            this.timerRemain = this.timer

            if (this.lengthCounter && this.linearRemain) {
                this.sequencer = (this.sequencer + 1) % SequenceTab.length
            }
        }
    }

    updateLength() {
        if(!this.linerCounterControl && this.lengthCounter)
            this.lengthCounter--
    }

    write(addr, val) {
        this.ram[addr] = val
        
        if (addr == this.addr + 3) {
            this.sequencer = 0
            this.linearReloadFlag = true
            this.lengthCounter = LengthTable[this.lengthCounterLoad]
        }
    }

    get linerCounterControl() {
        return getBit(this.ram[this.addr], 7)
    }

    get linearCounterLoad() {
        return this.ram[this.addr] & 127
    }

    get timerLow() {
        return this.ram[this.addr+2]
    }

    get timerHigh() {
        return this.ram[this.addr+3] & 0x7
    }

    get timer(){
        return ( this.timerHigh << 8 ) | this.timerLow
    }

    get lengthCounterLoad() {
        return this.ram[this.addr + 3] >> 3
    }
}