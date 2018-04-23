class BufferWriter {
    private buffer: ArrayBuffer;
    private dataView: DataView;
    private position: number;

    constructor(capacity?: number) {
        this.buffer = new ArrayBuffer(capacity ? capacity : 1024);
        this.dataView = new DataView(this.buffer);
        this.position = 0;
    }

    writen(value: number, bytes: number) {
        for (let i = 1; i <= bytes; i++) {
            this.dataView.setUint8(this.position + bytes - i, value % 256);
            value /= 256;
        }
        this.position += bytes;
        return this;
    }

    fill(value: number, bytes: number) {
        for (let i = 0; i < bytes; i++) {
            this.dataView.setUint8(this.position++, value);
        }
        return this;
    }

    writeInt8(value: number) {
        this.dataView.setInt8(this.position++, value);
        return this;
    }

    writeInt16(value: number) {
        this.dataView.setInt16(this.position, value);
        this.position += 2;
        return this;
    }

    writeInt32(value: number) {
        this.dataView.setInt32(this.position, value);
        this.position += 4;
        return this;
    }

    writeUint8(value: number) {
        this.dataView.setUint8(this.position++, value);
        return this;
    }

    writeUint16(value: number) {
        this.dataView.setUint16(this.position, value);
        this.position += 2;
        return this;
    }

    writeUint32(value: number) {
        this.dataView.setUint32(this.position, value);
        this.position += 4;
        return this;
    }

    writeBuffer(buf: ArrayBuffer, len?: number) {
        if (!len)
            len = buf.byteLength;
        let arr = new Uint8Array(buf, 0, len);
        for (let i = 0; i < arr.length; i++) {
            this.dataView.setUint8(this.position++, arr[i]);
        }
        return this;
    }

    writeString(str: string) {
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c > 0x7FF) {
                this.dataView.setUint8(this.position++, (c >> 12) | 0xE0);
                this.dataView.setUint8(this.position++, (c >> 6) & 0x3F | 0x80);
                this.dataView.setUint8(this.position++, c & 0x3F | 0x80);
            }
            else if (c > 0x7F) {
                this.dataView.setUint8(this.position++, (c >> 6) & 0x3F | 0x80);
                this.dataView.setUint8(this.position++, c & 0x3F | 0x80);
            }
            else
                this.dataView.setUint8(this.position++, c);
        }
        this.dataView.setUint8(this.position++, 0);
        return this;
    }

    getBuffer() {
        return new Uint8Array(this.buffer, 0, this.position);
    }
}