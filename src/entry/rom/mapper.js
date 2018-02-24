import {prgBankSize, chrBankSize} from '../../constants'

export const MirroringType = {
    s1lb: Symbol.for('S1LB'),
    s1ub: Symbol.for('S1UB'),
    vertical: Symbol.for('vertical'),
    horizontal: Symbol.for('horizontal'),
    fourScreen: Symbol.for('fourScreen'),
}
/**
 * data bridge between ram & rom
 */
class CommonMapper{
    constructor(rom){
        this.rom = rom
    }

    get mirrorType() {
        if (this.rom.mirroring) {
            return MirroringType.vertical
        }
        return MirroringType.horizontal
    }

    write(addr, val) {
        throw new Error('no write method')
    }

    map(addr) {
        return addr - 0x8000
    }

    mapCHR(addr) {
        return addr
    }

}

class NROM extends CommonMapper {
    map(addr) {
        if(this.rom.proms === 1 && addr >= 0xC000)
            addr -= 0x4000
      return addr - 0x8000
    }
}


/**
 * http://wiki.nesdev.com/w/index.php/MMC1#Control_.28internal.2C_.248000-.249FFF.29
 */
class MMC1 extends CommonMapper{
    constructor(rom){
        super(rom)
        this.control = 0x0c
        this.chrbk0 = 0
        this.chrbk1 = 0
        this.prgbk = 0
        this.loadRegister = 0
        this.counter = 0
    }
    
    map(addr) {
        let bank = 0
        let offset = addr & 0x3FFF
        let bankIdx = this.prgbk & 0xF

        switch((this.control>>2)&0x03) {
            case 0:
            case 1:
                offset = offset | (addr & 0x4000)
                bank = bankIdx & 0xE
                break
            case 2:
                bank = (addr < 0xC000) ? 0 : bankIdx
                break
            case 3:
                bank = (addr >= 0xC00) ? this.rom.proms - 1 : bankIdx
                break
        }

        return bank * 0x4000 + offset
    }
    
    mapCHR(addr) {
        let bank = 0
        let offset = addr & 0xFFF

        if ((this.control>>4) & 0x01) {  // sperate 4KB
            bank = (addr < 0x1000 ? this.chrbk0 : this.chrbk1) & 0x1F
        } else { // 8KB
            bank = this.chrbk0 & 0x1E
            offset = offset | (addr & 0x1000)
        }

        return bank * 0x1000 + offset
    }

    get mirrorType() {
        switch(this.control & 0x03) {
            case 0:
                return MirroringType.s1lb
            case 1:
                return MirroringType.s1ub
            case 2:
                return MirroringType.vertical
            case 3:
                return MirroringType.horizontal
        }
    }

    write(addr, val) {
        if (val & 0x80) {
            this.counter = 0
            this.loadRegister = 0

            if ( (addr & 0x6000) === 0 ) {
                this.control = this.control | 0x0C
            }
        } else {
            this.loadRegister = ((val & 1) << 4) | (this.loadRegister >> 1)
            this.counter++

            if(this.counter >= 5) {
                switch(addr & 0x6000) {
                    case 0x0:
                        this.control = this.loadRegister
                        break
                    case 0x2000:
                        this.chrbk0 = this.loadRegister
                        break
                    case 0x4000:
                        this.chrbk1 = this.loadRegister
                        break
                    case 0x6000:
                        this.prgbk = this.loadRegister
                        break
                }
                this.counter = 0
                this.loadRegister = 0
            }
        }
    }
}

// http://wiki.nesdev.com/w/index.php/UxROM
class UxROM extends CommonMapper{

    constructor(rom){
        super(rom)
        this.latch = 0
    }

    map(addr) {
        let bank = (addr < 0xC000) ? this.latch : this.rom.proms - 1
        return 0x4000 * bank + (addr & 0x3FFF)
    }

    write(addr, val) {
        this.latch = val & 0xF
    }
}

export default {
    createMapper: (rom) => {

        switch(rom.mapperType){
            case 0:
                return new NROM(rom)
            case 1:
                return new MMC1(rom)
            case 2:
                return new UxROM(rom)
            default:
                throw new Error(`unsupport mapper type rom.mapperType`)
        }
    }
}