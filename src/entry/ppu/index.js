import RAM from '../ram'
import getBit from '../../util/bit'
import bit from '../../util/bit'
import {InterruptType} from '../cpu'
import {MirroringType} from '../rom/mapper'

const Color = {
    red: Symbol.for('red'),
    blue: Symbol.for("Blue"),
    green: Symbol.for('green'),
}

class ObjectAttribute{
    constructor(ram, addr, id) {
        this.ram = ram
        this.id = id
        this.addr = addr
        this.pixel = -1
    }

    get y() {
        return this.ram[this.addr]
    }

    get blank() {
        return getBit(this.ram[this.addr+1], 0) ? 0x1000 : 0
    }

    get tile() {
        return this.ram[this.addr+1]
    }

    get palette() {
        return this.ram[this.addr+2] & 0x03
    }
    
    get priority() {
        return getBit(this.ram[this.addr+2], 5)
    }

    get flipH() {
        return getBit(this.ram[this.addr+2], 6)
    }

    get flipV() {
        return getBit(this.ram[this.addr+2], 7)
    }

    get x() {
        return this.ram[this.addr+3]
    }
}

const Palettes =[
    /* 0x00 */ 0xff757575,
    /* 0x01 */ 0xff8f1b27,
    /* 0x02 */ 0xffab0000,
    /* 0x03 */ 0xff9f0047,
    /* 0x04 */ 0xff77008f,
    /* 0x05 */ 0xff1300ab,
    /* 0x06 */ 0xff0000a7,
    /* 0x07 */ 0xff000b7f,
    /* 0x08 */ 0xff002f43,
    /* 0x09 */ 0xff004700,
    /* 0x0a */ 0xff005100,
    /* 0x0b */ 0xff173f00,
    /* 0x0c */ 0xff5f3f1b,
    /* 0x0d */ 0xff000000,
    /* 0x0e */ 0xff000000,
    /* 0x0f */ 0xff000000,
    /* 0x10 */ 0xffbcbcbc,
    /* 0x11 */ 0xffef7300,
    /* 0x12 */ 0xffef3b23,
    /* 0x13 */ 0xfff30083,
    /* 0x14 */ 0xffbf00bf,
    /* 0x15 */ 0xff5b00e7,
    /* 0x16 */ 0xff002bdb,
    /* 0x17 */ 0xff0f4fcb,
    /* 0x18 */ 0xff00738b,
    /* 0x19 */ 0xff009700,
    /* 0x1a */ 0xff00ab00,
    /* 0x1b */ 0xff3b9300,
    /* 0x1c */ 0xff8b8300,
    /* 0x1d */ 0xff000000,
    /* 0x1e */ 0xff000000,
    /* 0x1f */ 0xff000000,
    /* 0x20 */ 0xffffffff,
    /* 0x21 */ 0xffffbf3f,
    /* 0x22 */ 0xffff975f,
    /* 0x23 */ 0xfffd8ba7,
    /* 0x24 */ 0xffff7bf7,
    /* 0x25 */ 0xffb777ff,
    /* 0x26 */ 0xff6377ff,
    /* 0x27 */ 0xff3b9bff,
    /* 0x28 */ 0xff3fbff3,
    /* 0x29 */ 0xff13d383,
    /* 0x2a */ 0xff4bdf4f,
    /* 0x2b */ 0xff98f858,
    /* 0x2c */ 0xffdbeb00,
    /* 0x2d */ 0xff000000,
    /* 0x2e */ 0xff000000,
    /* 0x2f */ 0xff000000,
    /* 0x30 */ 0xffffffff,
    /* 0x31 */ 0xffffe7ab,
    /* 0x32 */ 0xffffd7c7,
    /* 0x33 */ 0xffffcbd7,
    /* 0x34 */ 0xffffc7ff,
    /* 0x35 */ 0xffdbc7ff,
    /* 0x36 */ 0xffb3bfff,
    /* 0x37 */ 0xffabdbff,
    /* 0x38 */ 0xffa3e7ff,
    /* 0x39 */ 0xffa3ffe3,
    /* 0x3a */ 0xffbff3ab,
    /* 0x3b */ 0xffcfffb3,
    /* 0x3c */ 0xfff3ff9f,
    /* 0x3d */ 0xff000000,
    /* 0x3e */ 0xff000000,
    /* 0x3f */ 0xff000000
  ]

export default class PPU{
    constructor(ram, cpu){
        this.counter = 0
        this.ram = ram
        this.vram = new RAM(0x4000)
        this.scanline = 0
        this.cpu = cpu
        this.nameTabAddr = 0
        this.waitNextByte = true

        this.attrTab = {
            low:0,
            high: 0
        }
        this.patternTab = {
            low: 0,
            high: 0
        }

        this.latch = {
            nameTab:    0,
            attrTabLow: 0,
            attrTabHigh:0,
            patternLow: 0,
            patternHigh:0
        }

        this.vramAddr = 0
        this.cycle = 0

        this.vramAddrTemp = 0
        this.frame = 0

        this.fineXScroll = 0


        this.oamPrim = new RAM(256)

        this.sprites = new Array(64)
        for(let i=0; i < this.sprites.length; i++) {
            this.sprites[i] = new ObjectAttribute(this.oamPrim, i << 2, i)
        }

        this.sprites.pixelBuff = []

        for(let i=0; i < 256; i++) {
            this.sprites.pixelBuff.push({
                pixel: -1,
                priority: -1,
                spriteId: -1,
            })
        }

        this.activeObjects = []
    }

    setRom(rom) {
        this.rom = rom
    }

    connect(screen) {
        if (screen && typeof(screen.renderPixel) === typeof(()=>{}) && typeof(screen.redraw) === typeof(()=>{})) {
            return this.screen = screen
        }
        throw new Error('invalid screen')
    }

    run() {
        this.renderPixel()
        this.shiftRegisters()
        this.execute()
        this.evaluateSprites()
        this.updateFlags()
        this.countUpScrollCounters()
        this.countUpCycle()
        this.counter++
    }

    renderPixel() {
        if (this.cycle > 256 || this.scanline >= 240 || this.cycle === 0) return
        let x = this.cycle - 1
        let bgPixel = Palettes[this.bgPixel]
        let color = Palettes[this.read(0x3F00)] // todo turn to color
        let sp = this.sprites.pixelBuff[x]
        if( this.bgVisible && this.spriteVisible) {
            if( sp.pixel === -1){
                color = bgPixel
            } else {
                if (bgPixel === color) {
                    color = sp.pixel
                } else {
                    color = sp.priority === 0 ? sp.pixel : bgPixel
                }
            }
        } else if (this.bgVisible && !this.spriteVisible) {
            color = bgPixel
        } else if (!this.bgVisible && this.spriteVisible) {
            if (sp.pixel !== -1) {
                color = sp.pixel
            }
        }

        color = this.emphasis(color)

        if(this.bgVisible && this.spriteVisible && (sp.spriteId === 0) && sp.pixel !== 0 && bgPixel !== 0) {
            this.sprite0Hit = 1
        }

        if (this.screen) {
            this.screen.renderPixel(x, this.scanline, color)
        }
    }

    get bgPixel() {
        let offset = 15 - this.fineXScroll

        let low = (getBit(this.patternTab.high, offset) << 1 ) | getBit(this.patternTab.low, offset)
        let high = (getBit(this.attrTab.high, offset) << 1) | getBit(this.attrTab.low, offset)
        let index = (high << 2) | low

        if (this.greyScale) {
            index = index & 0x30
        }
        return this.read(0x3F00 + index)
    }

    emphasis(color) {
        switch(this.colorEmphasisMode) {
            case Color.red:
                return color | 0x00FF0000
            case Color.blue:
                return color | 0x000000FF
            case Color.green:
                return color | 0x0000FF00
            default:
                return color
        }
    }

    countUpCycle() {
        this.cycle ++
        if (this.cycle > 340) {
            this.cycle = 0
            this.scanline ++
        }

        if (this.scanline > 261) {
            this.scanline = 0
            this.frame++
        }
    }

    updateFlags() {
        switch(this.cycle) {
            case 1:
                switch(this.scanline) {
                    case 241:
                        this.vBlank = 1
                        if (this.screen) {
                            // if (this.counter === 439550) debugger
                            this.screen.redraw()
                        }
                        break
                    case 261:
                        this.vBlank = 0
                        this.sprite0Hit = 0
                        this.spriteOveflow = 0
                        break
                }
                break
            case 10:
                if( this.scanline === 241 ){
                    if( this.nmi ){
                        this.cpu.doInterrupt(InterruptType.nmi)
                        break
                    }
                }
        }
    }

    countUpScrollCounters() {
        if( this.bgVisible === false && this.spriteVisible === false) return

        if( this.scanline >= 240 && this.scanline <= 260)  return 

        if( this.scanline === 261 ) {
            if (this.cycle >= 280 && this.cycle <= 304) {
                this.vramAddr &= ~0x7BE0
                this.vramAddr |= (this.vramAddrTemp & 0x7BE0)
            }
        }

        if (this.cycle === 0 || (this.cycle >= 258 && this.cycle <= 320) )  return

        if (this.cycle % 8 === 0) {
            let t = this.vramAddr
            if((t & 0x1F) === 31) {
                t &= ~0x1F;
                t ^= 0x400;
              } else {
                t++;
              }

            this.vramAddr = t
           
        }

        if(this.cycle === 256) {
            let v = this.vramAddr;

            if((v & 0x7000) !== 0x7000) {
              v += 0x1000;
            } else {
              v &= ~0x7000;
              let y = (v & 0x3E0) >> 5;
      
              if(y === 29) {
                y = 0;
                v ^= 0x800;
              } else if(y === 31) {
                y = 0;
              } else {
                y++;
              }
      
              v = (v & ~0x3E0) | (y << 5);
            }

            this.vramAddr = v;
        }

        if(this.cycle === 257) {

            this.vramAddr &= ~0x41F
            this.vramAddr |= (this.vramAddrTemp & 0x41F)

        }
    }

    tileMapFor16(addr) {
        return (addr & 0x01) * 0x1000 + (addr >> 1) * 0x20
    }

    processSpritePixels() {

        this.sprites.pixelBuff.forEach((item)=>{
            item.pixel = -1
            item.spriteId = -1
            item.priority = -1
        })
        
        let ay = this.scanline - 1
       
        let height = this.spriteSize ? 16 : 8

        this.activeObjects.forEach( (oa) => {
            let j = ay - oa.y
            let cy = oa.flipV ? height - j - 1 : j
            
            let ptIndex = this.spriteSize ? this.tileMapFor16(oa.tile) : oa.tile

            for(let k=0; k < 8; k++) {
                let cx = oa.flipH ? 7 - k : k
                let x = oa.x + k
                if ( x >= 256) break

                let lsb = this.getPatternTableItem(ptIndex, cx, cy, height)

                if (lsb !== 0) {
                    if(this.sprites.pixelBuff[x].pixel === -1) {
                        this.sprites.pixelBuff[x].pixel = Palettes[this.read(0x3F10 + ((oa.palette << 2) | lsb))]
                        this.sprites.pixelBuff[x].priority = oa.priority
                        this.sprites.pixelBuff[x].spriteId = oa.id
                    }
                }
            }

        })
        
    }

    getPatternTableItem(index, x, y, height) {
        let ax = x % 8, ay = y % 8
        let offset, a, b

        switch(height) {
            case 8:
                offset = this.spritePatternTabAddr ? 0x1000 : 0
                a = this.read(offset + index * 16 + ay)
                b = this.read(offset + index * 16 + 0x8 + ay)
                break
            case 16:
                ay += (y >> 3) * 16
                a = this.read(index + ay)
                b = this.read(index + ay + 0x08)
                break
        }
        return ((a >> (7 - ax)) & 1) | (((b >> (7 - ax)) & 1) << 1)
    }

    isOnScanline(scanline, sprite, height) {
        return (scanline >= sprite.y) && (scanline < sprite.y + height)
    }

    // https://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation
    evaluateSprites() {
        if (this.scanline >= 240) {
            return
        }

        if ( this.cycle === 0) {
            this.processSpritePixels()
        } else if (this.cycle === 65) {
            let height = this.spriteSize ? 16 : 8
            this.activeObjects = []
            for(let i=0; i < this.sprites.length; i++) {
                if(this.isOnScanline(this.scanline, this.sprites[i], height)) {
                    // debugger
                    if( this.activeObjects.length < 8){
                        this.activeObjects.push(this.sprites[i])
                    } else {
                        this.spriteOveflow = 1
                        break
                    }
                } 
            }
       }
    }

    shiftRegisters() {
        if ( this.scanline >= 240 && this.scanline <= 260) {
            return
        }

        // http://wiki.nesdev.com/w/index.php/PPU_rendering
        if ( (this.cycle >= 1 && this.cycle <= 256) ||
            (this.cycle >= 329 && this.cycle <= 336) ){
                this.attrTab.low = (this.attrTab.low << 1) & 0xFFFF
                this.attrTab.high = (this.attrTab.high << 1) & 0xFFFF
                this.patternTab.low = (this.patternTab.low << 1) & 0xFFFF
                this.patternTab.high = (this.patternTab.high << 1) & 0xFFFF
            }
    }

    updateAttrTabAddr() {
        let addr = 0x23C0 | (this.vramAddr & 0x0C00) | ((this.vramAddr >> 4) & 0x38) | ((this.vramAddr >> 2) & 0x07)
        let val = this.read(addr)

        let x = this.vramAddr & 0x1F
        let y = (this.vramAddr>>5) & 0x1F

        let tb = (y%4) >= 2 ? 1 : 0 // top, bottom
        let rl = (x%4) >= 2 ? 1 : 0 // right, left

        let position = (tb << 1) | rl

        let temp = (val >> (position << 1)) & 0x3

        this.latch.attrTabHigh = ((temp >> 1) === 1) ? 0xFF : 0
        this.latch.attrTabLow = ((temp & 0x1) === 1) ? 0xFF : 0
    }

    execute() {

        if(this.cycle === 0 || this.cycle >= 337) return

        if (this.scanline >= 240 && this.scanline <= 260) return

        if (this.cycle >= 257 && this.cycle <= 320) return

        if (this.cycle >= 337) return

        switch( (this.cycle - 1) % 8 ) {
            case 0:
                this.latch.nameTab = this.read(0x2000 | (this.vramAddr & 0x0FFF) )
                break
            case 2:
                this.updateAttrTabAddr()
                break
            case 4:{
                let fineY = (this.vramAddr >> 12) & 0x07
                let index = (this.bgPatternTabAddr ? 0x1000 : 0) + this.nameTabAddr * 0x10 + fineY
                this.latch.patternLow = this.read(index)
                }
                break
            case 6:
                {
                let fineY = (this.vramAddr >> 12) & 0x07
                let index = (this.bgPatternTabAddr ? 0x1000 : 0) + this.nameTabAddr * 0x10 + fineY
             
                this.latch.patternHigh = this.read(index + 0x8)
                }
                break
        }

        if (this.cycle % 8 === 1) {
            this.nameTabAddr = this.latch.nameTab
            this.attrTab.low =  (this.attrTab.low & 0xFF00 ) | (0xFF & this.latch.attrTabLow)
            this.attrTab.high = (this.attrTab.high & 0xFF00 ) | (0xFF & this.latch.attrTabHigh)
            this.patternTab.low = (this.patternTab.low & 0xFF00 ) | (0xFF & this.latch.patternLow)
            this.patternTab.high = (this.patternTab.high & 0xFF00 ) | (0xFF & this.latch.patternHigh)
        }
    
    }

    write(addr, val) {
        addr &= 0x3FFF

        if (addr < 0x2000 && this.rom.croms) {
            return this.rom.write(addr, val)
        }

        if (addr >= 0x2000 && addr < 0x3F00) {
            addr = this.mirrorNameTabAddr(addr&0x2FFF, this.rom.mirrorType)
            return this.vram[addr] = val
        }

        if (addr >= 0x3F00 && addr < 0x4000) addr &= 0x3F1F

        switch(addr) {
            case 0x3F10:
            case 0x3F14:
            case 0x3F18:
            case 0x3F1c:
                addr -= 0x10
                break
        }

        return this.vram[addr] = val
    }

    read(addr) {
        addr &= 0x3FFF

        if (this.rom.croms && addr < 0x2000) {
            return this.rom.read(addr)
        }

        if (addr >= 0x2000 && addr < 0x3F00) {
            // read from vram
            return this.vram[this.mirrorNameTabAddr(addr & 0x2FFF, this.rom.mirrorType)]
        }

        if (addr >= 0x3F00 && addr < 0x4000) {
            addr &= 0x3F1F
        }

        switch( addr ) {
            case 0x3F10:
            case 0x3F14:
            case 0x3F18:
            case 0x3F1C:
                addr -= 0x10
        }
        return this.vram[addr]
    }

    reset(){
    }

    powerUp(){
        this.status = 0x80
    }

    readRegister(addr) {
        switch (addr) {
            case 0x2002:
                let val = this.status
                this.vBlank = 0
                return val
            case 0x2004:
                return this.oamPrim[this.oamAddr]
            case 0x2007:
                {
                    const temp = this.addr
                    let val
                    if( (this.vramAddr & 0x3FFF) >= 0  && (this.vramAddr & 0x3FFF) < 0x3F00 ){
                        val = this.vramBuff
                        this.vramBuff = this.read(this.vramAddr)
                        return val
                    } else {
                        val = this.read(this.vramAddr)
                        this.vramBuff = val
                    }
                    const org = this.vramAddr
                    this.vramAddr+= this.vramIcrement ? 32 : 1
                    this.vramAddr &= 0x7FFF

                    this.addr = this.vramAddr & 0xFF
                    return val
                }
                break
            default:
                return 0
        }
    }

    writeRegister(addr, val) {
        switch(addr) {
            case 0x2000:
                this.ctrl = val
                this.vramAddrTemp &= ~0xC00
                this.vramAddrTemp |= (val & 0x03) << 10
                break
            case 0x2001:
                this.mask = val
                break
            case 0x2003:
                this.oamAddr = val
                break
            case 0x2004:
                this.oamData = val
                this.oamPrim[this.oamAddr] = val
                this.oamAddr++
                break
            case 0x2005:
                this.scroll = val

                if (this.waitNextByte) {
                    this.fineXScroll = val & 0x07
                    this.vramAddrTemp &= ~0x1F
                    this.vramAddrTemp |= (val >> 3) & 0x1F
                } else {
                    this.vramAddrTemp &= ~0x73E0
                    this.vramAddrTemp |= (val & 0xF8) << 2
                    this.vramAddrTemp |= (val & 0x7) << 12
                }
                this.waitNextByte = !this.waitNextByte
                break
            case 0x2006:
                if (this.waitNextByte) {
                    this.vramAddrTemp &= ~ 0x7F00
                    this.vramAddrTemp |= (val & 0x3F) << 8
                } else {
                    this.addr = val & 0xFF
                    this.vramAddrTemp &= ~0xFF
                    this.vramAddrTemp |= (val & 0xFF)
                    this.vramAddr = this.vramAddrTemp
                }
                this.waitNextByte = !this.waitNextByte
                break
            case 0x2007:
                this.data = val
                this.write(this.vramAddr, val)

                this.vramAddr += this.vramIcrement ? 32 : 1
                this.vramAddr &= 0x7FFF
                this.addr = this.vramAddr & 0xFF 
                break
            case 0x4014:
                this.oamDMA = val
                let offset = val * 0x100
                for(let i = this.oamAddr; i < 0x100; i++) {
                    this.oamPrim[i] = this.cpu.read(offset + i)
                }
                this.cpu.cycles += 514
                // debugger
                break

        }
    }


    mirrorNameTabAddr(addr, mirror) {
        addr &= 0x2FFF
        let baseAddr = 0

        switch(mirror) {
            case MirroringType.s1lb: // single Screen
            case MirroringType.s1ub:
                baseAddr = 0x2000
                break
            case MirroringType.horizontal: // horizontal
                if (addr >= 0x2000 && addr < 0x2008) baseAddr = 0x2000
                else if (addr >= 0x2800) baseAddr = 0x2400
                break
            case MirroringType.vertical: // vertical
                if ( (addr >= 0x2000 && addr < 0x2400) || (addr >=0x2800 && addr < 0x2C00) ) {
                    baseAddr = 0x2000
                } else {
                    baseAddr = 0x2400
                }
                break
            case MirroringType.fourScreen: // four screen
                if ( addr >= 0x2000 && addr < 0x2400) {
                    baseAddr = 0x2000
                } else if (addr >=2400 && addr < 0x2800){
                    baseAddr = 0x2400
                } else if (addr >= 0x2800 && addr < 0x2C00) {
                    baseAddr = 0x2800
                } else {
                    baseAddr = 0x2C00
                }
                break
        }
        return baseAddr | (addr & 0x3FF)
    }


    // 0 : go across; 1 : nextline going down
    get vramIcrement(){
        return getBit(this.ctrl, 2)
    }

    // 0: $000, 1: $1000
    get spritePatternTabAddr(){
        return getBit(this.ctrl, 3)
    }

    // 0: $000, 1: $1000
    get bgPatternTabAddr(){
        return getBit(this.ctrl, 4)
    }

    // 0: 8x8, 1: 8x16
    get spriteSize(){
        return getBit(this.ctrl, 5)
    }

    select() {
        return getBit(this.ctrl, 6)
    }

    // 0: off, 1: on
    get nmi() {
        return getBit(this.ctrl, 7)
    }

    // 0: normal, 1: greyscale
    get greyScale(){
        return getBit(this.mask, 0)
    }

    bgLeft8Visible() {
        return getBit(this.mask, 1)
    }

    spriteLeft8Visible() {
        return getBit(this.mask, 2)
    }

    get bgVisible() {
        return !!getBit(this.mask, 3)
    }

    get spriteVisible() {
        return !!getBit(this.mask, 4)
    }

    get spriteOveflow() {
        return getBit(this.status, 5)
    }

    set spriteOveflow(val) {
        val = val ? 1 : 0
        this.status = ( this.status & 0xDF) | (val << 5)
    }

    get sprite0Hit() {
        return getBit(this.status, 6)
    }

    set sprite0Hit(val) {
        val = val ? 1 : 0
        this.status = (this.status & 0xEF ) | (val << 6)
    }

    get vBlank() {
        return !! getBit(this.status, 7)  
    }

    set vBlank(val) {
        val = val ? 1 : 0
        this.status = (this.status & 0x7F) | (val<<7)
    }

    set ctrl(val) {
        this.ram[0x2000] = val
    }

    get ctrl() {
        return this.ram[0x2000]
    }

    set mask(val) {
        this.ram[0x2001] = val        
    }

    get mask() {
        return this.ram[0x2001]
    }

    get status() {
        return this.ram[0x2002]
    }
    set status(val) {
        this.ram[0x2002] = val
    }

    get oamAddr(){
        return this.ram[0x2003]
    }

    set oamAddr(val) {
        this.ram[0x2003] = val
    }

    get colorEmphasisMode() {
        if (getBit(this.mask, 7) === 1) return Color.blue
        else if (getBit(this.mask, 6) === 1) return Color.green
        else if (getBit(this.mask, 5) === 1) return Color.red
    }

    

    get oamData() {
        return this.ram[0x2004]
    }

    set oamData(val) {
        this.ram[0x2004] = val
    }

    get scroll() {
        return this.ram[0x2005]
    }

    set scroll(val) {
        this.ram[0x2005] = val
    }

    get addr(){
        return this.ram[0x2006]
    }

    set addr(val) {
        this.ram[0x2006] = val
    }

    get data(){
        return this.ram[0x2007]
    }

    set data(val) {
        this.ram[0x2007] = val
    }

    set oamDMA(val) {
        this.ram[0x4014] = val
    }

    get oamDMA(){
        return this.ram[0x4014]
    }

}