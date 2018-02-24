export default class Screen {

    constructor(){
        let canvasNode = document.createElement('canvas')
        canvasNode.width = 256
        canvasNode.height = 240
        let context = canvasNode.getContext('2d')
        let img = context.createImageData(canvasNode.width, canvasNode.height)
        let bitmap = new Uint32Array(img.data.buffer)

        this.bitmap = bitmap

        let frames = 0
        let lastFrame = null
        let fps = 0
        let frameCounter = 0

        this.canvas = ()=>{return canvasNode}

        this.renderPixel = (x, y, val) => {
            bitmap[y*canvasNode.width + x] = val
            this.counter++
        }

        /*
        Object.defineProperty(this, "fps", {
            get: function () {
                return fps
            }
        })
        */

        this.redraw = () => {
            /*
            if (this.compare(this.bitmap, data) === false) {
                debugger
            }
            */
            context.putImageData(img, 0, 0)

            let now = (new Date().getTime() - lastFrame)/1000
            frameCounter++
            if (frames == 0) {
                lastFrame = new Date().getTime()
            } else if ( now >= 1 ) {
                fps = frameCounter / now
                frameCounter = 0
                lastFrame = new Date().getTime()
            }
            frames++
            
            if(this.afterRedraw) {
                this.afterRedraw(fps, frames)
            }
        }

        this.powerUp = () => {
            /*
            for(let i=0; i< canvasNode.height; i++) {
                for(let j=0; j < canvasNode.width; j++) {
                    if (i < 128 && j <120) {
                        this.renderPixel(j, i, 0xFF0000FF)
                    } else if ( i < 128 && j >= 120) {
                        this.renderPixel(j, i, 0xFF00FF00)
                    } else if ( i >= 128 && j < 120) {
                        this.renderPixel(j, i, 0xFFFF0000)
                    } else {
                        this.renderPixel(j, i, 0xFF000000)
                    }
                }
            }
            */
            // this.redraw()
        }

        this.frames = ()=>frames


    }

    mount(parent) {
        parent.appendChild(this.canvas())
    }

}