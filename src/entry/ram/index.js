/**
 * http://wiki.nesdev.com/w/index.php/CPU_memory_map
 */

export default class RAM extends Array{
    constructor(size = 0x10000){
        super(size).fill(0)
    }

    powerUp(){
        this[0x2000] = 0
        this[0x2001] = 0
        this[0x2002] = 0
        this[0x2003] = 0
        this[0x2005] = 0
        this[0x2006] = 0
        this[0x2007] = 0
    }
}