class BufferReader {
    private position: number;
    private dataView: DataView;

    constructor(dataArray: Uint8Array) {
        this.dataView = new DataView(dataArray.buffer, dataArray.byteOffset, dataArray.byteLength);
        this.position = 0;
    }
   
    readInt8() {
        return this.dataView.getInt8(this.position++);
    }

    readInt16() {
        let ret = this.dataView.getInt16(this.position, false);
        this.position += 2;
        return ret;
    }

    readInt32() {
        let ret = this.dataView.getInt32(this.position, false);
        this.position += 4;
        return ret;
    }

    readUint8() {
        return this.dataView.getUint8(this.position++);
    }

    readUint16() {
        let ret = this.dataView.getUint16(this.position, false);
        this.position += 2;
        return ret;
    }

    readUint32() {
        let ret = this.dataView.getUint32(this.position, false);
        this.position += 4;
        return ret;
    }

    readString() {
        let ret = '';
        let s = this.position;
        while ((this.position - s) < 25) {
            var c = this.readUint8();
            if (c == 0)
                break;
            if (c < 0x80)
                ret += String.fromCharCode(c);
            else if (c < 0xE0) {
                c = c & 0x1F << 6;
                let c1 = this.readUint8();
                c |= c1 & 0x3F;
                ret += String.fromCharCode(c);
            }
            else {
                c = (c & 0xF) << 6;
                let c1 = this.readUint8();
                c = (c | (c1 & 0x3F)) << 6;
                let c2 = this.readUint8();
                c |= c2 & 0x3F;
                ret += String.fromCharCode(c);
            }
        }
        return ret;
    }

    readn(bytes: number): number {
        let ret = 0;
        for (let i = 0; i < bytes; i++) {
            ret *= 256;
            ret += this.dataView.getUint8(this.position++);
        }
        return ret;
    }
}