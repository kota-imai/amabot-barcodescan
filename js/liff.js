// LIFF用
document.addEventListener("DOMContentLoaded", () => {
    liff.init({
        liffId: '1655195614-bBDdE0PG'
    })
        .then(() => {
            document.addEventListener('scan', (event) => {
                if (!liff.isInClient()) {
                    document.getElementById('log').value += '失敗\n'
                    return
                }
                liff.sendMessages([{
                    'type': 'text',
                    'text': event.detail
                }]).then(function () {
                    liff.closeWindow()
                }).catch(function (error) {
                    document.getElementById('log').innerText += 'メッセージが送信できませんでした：' + error + '\n'
                })
            })
        })
        .catch((err) => {
            document.getElementById('log').innerText = 'init ng\n' + err
        })
})