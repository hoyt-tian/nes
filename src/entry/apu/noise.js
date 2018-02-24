// http://wiki.nesdev.com/w/index.php/APU_Noise
import {LengthTable} from '../../constants'
const PeriodTab = [
    0x004, 0x008, 0x010, 0x020,
    0x040, 0x060, 0x080, 0x0A0,
    0x0CA, 0x0FE, 0x17C, 0x1FC,
    0x2FA, 0x3F8, 0x7F2, 0xFE4
]

export default class Noise{
    constructor(ram, addr) {
        this.ram = ram
        this.addr = addr

        this.timerRemain = 0
        this.period = 0
        this.lengthCounter = 0

        this.envelopeRemain = 0
        this.envelopeStartFlag = false
        this.envelopeDecayLevel = 0

        this.shiftRegister = 1
    }

    write(addr, val) {
        this.ram[addr] = val
        if (addr == this.addr + 2) {
            this.period = PeriodTab[this.noisePeriod]
        }else if(addr == this.addr + 3) {
            this.envelopeStartFlag = true
            this.lengthCounter = LengthTable[this.lengthCounterLoad]
        }
    }

    execute() {
        if(this.lengthCounter === 0 || (this.shiftRegister & 1) === 1)
            return 0  
        return (this.constantFlag ? this.envelopePeroid : this.envelopeDecayLevelCounter) & 0xF;
    }

    doEnvelope() {
        if(this.envelopeStartFlag) {
            this.envelopeRemain = this.envelopePeroid
            this.envelopeDecayLevel = 0xF
            this.envelopeStartFlag = false
            return;
          }
      
          if(this.envelopeRemain) {
            this.envelopeRemain--
          } else {
            this.envelopeRemain = this.envelopePeroid
      
            if(this.envelopeDecayLevelCounter)
              this.envelopeDecayLevelCounter--
            else if(this.envelopeDecayLevelCounter === 0 && this.lengthCounterHalt )
              this.envelopeDecayLevelCounter = 0xF
          }
    }

    updateTimer() {
        if(this.timerRemain > 0) {
            this.timerRemain--
          } else {
            this.timerRemain = this.period
      
            let feedback = (this.shiftRegister & 1) ^
                             ((this.shiftRegister >> (this.loopFlag ? 6 : 1)) & 1);
      
            this.shiftRegister = (feedback << 14) | (this.shiftRegister >> 1);
          }
    }

    updateLength() {
        if(!this.lengthCounterHalt && this.lengthCounter)
            this.lengthCounter--
    }

    get lengthCounterHalt() {
        return (this.ram[this.addr] >> 5) & 0x01
    }

    get constantFlag() {
        return ( this.ram[this.addr] >> 4 ) & 0x01
    }

    get envelopePeroid() {
        return this.ram[this.addr] & 0xF
    }

    get noisePeriod() {
        return this.ram[this.addr + 2] & 0xF
    }

    get loopFlag() {
        return this.ram[this.addr + 2] >> 7
    }

    get lengthCounterLoad() {
        return this.ram[this.addr + 3]
    }
}