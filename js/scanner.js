$(function () {
    // スキャナー起動
    startScanner();
});

const startScanner = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#photo-area'),
            constraints: {
                decodeBarCodeRate: 3,
                successTimeout: 500,
                codeRepetition: true,
                tryVertical: true,
                frameRate: 15,
                width: 480,
                height: 640,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "ean_reader"
            ]
        },

    }, function (err) {
        if (err) {
            console.log(err);
            return
        }
        Quagga.start();

    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {
                        x: 0,
                        y: 1
                    }, drawingCtx, {
                        color: "blue",
                        lineWidth: 2
                    });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "#00F",
                    lineWidth: 2
                });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {
                    x: 'x',
                    y: 'y'
                }, drawingCtx, {
                    color: '#00B900',
                    lineWidth: 2
                });
            }
        }
    });

    // 検知後の処理
    let scanResults = []
    let resultBuffer = []
    Quagga.onDetected(function (result) {
        let isErr = false
        $.each(result.codeResult.decodedCodes, function (id, error) {
            if (error.error != undefined) {
                if (parseFloat(error.error) > 0.2) {
                    isErr = true
                }
            }
        })
        if (isErr) return

        // エラー率の中央値が0.1以上なら除外
        const errors = result.codeResult.decodedCodes.filter((_) => _.error !== undefined).map((_) => _.error)
        const median = _getMedian(errors)
        if (median > 0.1) {
            return
        }

        // 2連続で同じ値だった場合のみ採用する
        scanResults.push(result.codeResult.code)
        if (scanResults.length < 2) {
            return
        }
        if (scanResults[0] !== scanResults[1]) {
            scanResults.shift()
            return
        }

        // 複数回目は前回と値が違う時だけ発火
        if (resultBuffer.length > 0) {
            if (resultBuffer.slice(-1)[0] === result.codeResult.code) {
                return
            }
        }

        // チェックデジット
        if (!eanCheckDigit(result.codeResult.code)) {
            return
        }

        resultBuffer.push(result.codeResult.code)
        document.getElementById('result').value = result.codeResult.code;

        // イベント発火
        const event = new CustomEvent("scan", {
            detail: result.codeResult.code
        });
        document.dispatchEvent(event);
    });

    // 中央値を取得
    function _getMedian(arr) {
        arr.sort((a, b) => a - b)
        const half = Math.floor(arr.length / 2)
        if (arr.length % 2 === 1)
            return arr[half]
        return (arr[half - 1] + arr[half]) / 2.0
    }

    // JANコードチェックデジット
    // https://qiita.com/mm_sys/items/9e95c48d4684957a3940
    function eanCheckDigit(barcodeStr) {
        barcodeStr = ('00000' + barcodeStr).slice(-13);
        let evenNum = 0, oddNum = 0;
        for (var i = 0; i < barcodeStr.length - 1; i++) {
            if (i % 2 == 0) {
                oddNum += parseInt(barcodeStr[i]);
            } else {
                evenNum += parseInt(barcodeStr[i]);
            }
        }
        // 結果
        return 10 - parseInt((evenNum * 3 + oddNum).toString().slice(-1)) === parseInt(barcodeStr.slice(-1));
    }
}