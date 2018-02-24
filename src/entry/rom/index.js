import getBit from '../../util/bit'
import { prgBankSize, chrBankSize } from '../../constants'
import Mapper from  './mapper'

export default class ROM{
    // http://wiki.nesdev.com/w/index.php/NES_2.0
    constructor(data){
        // this.validate(data)
        this.proms = data[4] 
        this.croms = data[5] << 1// 8kB in Cartridge
        this.mapperType = (data[6] >> 4) | (data[7]& 0xF0)
        this.fourScreen = !!getBit(data[6], 3)
        this.trainer = !!getBit(data[6], 2)
        this.sram = !!getBit( data[6], 1)
        this.mirroring = data[6] & 0x01

        /*
        this.playChoice = !!getBit(data.charCodeAt(7), 1)
        this.vs = !!(data[7] & 0x01)
        this.nes2 = ((data[7] & 0x0C) >> 2) == 0x2
        this.submapper = (data[8] & 0xF0) >> 4
        this.mapperNumber = data[8] & 0x0F
        this.chrSize = (data[9] & 0xF0) >> 4
        this.prgSize = data[9] & 0x0F
        this.prgRAMBB = (data[10] & 0xF0) >> 4
        this.prgRAM = data[10] & 0x0F
        this.chrRAMBB = (data[11] & 0xF0) >> 4
        this.chrRAM = data[11] & 0x0F
        this.tvSystem = (data[12] & 0x01) ? 'NTSC' : 'PAL'
        this.tvBoth = !!getBit(data[12], 1)
        */
        // skip byte 13 & 14
        this.binary = data

        this.mapper = Mapper.createMapper(this)
        // mapper.loadData()

    }

    parseTiles(data){

    }

    read(addr) {
        let offset = 16

        if (addr < 0x2000) {
            offset += this.proms * 0x4000
            offset += this.mapper.mapCHR(addr)
        } else {
            offset += this.mapper.map(addr)
        }

        return this.binary[offset]
    }

    write(addr, val) {
        this.mapper.write(addr, val)
    }

    setMapper(mapper) {
        this.mapper = mapper
    }

    get mirrorType() {
        return this.mapper.mirrorType
    }

    static load(url){
        return fetch(url).then( 
            response => response.arrayBuffer()
        ).then( (buff) => {
            const data = new Uint8Array(buff)
            return new ROM(data)
        } )
    }
}