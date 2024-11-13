const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */


function activate(context) {
	//Регистрация команды 'extension.timer'
	//Заполняем тело команды 'extension.timer'
    let disposable = vscode.commands.registerCommand('extension.timer', function () {

		//Ищем в каком активном редакторе (окне vsCode) находится пользователь
        const editor = vscode.window.activeTextEditor;
		
		//Если редактор не активен, то выход из команды
        if (!editor)
			return;
		
		//Находим документ, который открыт в активном редакторе
		const document = editor.document;
		//Считаем кол-во строк в документе
		const allLines = document.lineCount;

		const maskStart = "TIMER_PLAGIN_START_";
		const maskEnd = "TIMER_PLAGIN_END_";

		let includeTime = false;
		let includeCSTDIO = false;
		//Словарь, где какое-то k-ому таймеру соответствует bool type (есть ли пара start - end)
		let timers = {};
		let linesDelete = [];

		//Создание regex шаблонов
		const regexStart = /^clock_t TIMER_PLAGIN_START_(\d+) = clock\(\);$/;
		const regexEnd = /^clock_t TIMER_PLAGIN_END_(\d+) = clock\(\);$/;

		for (let i = 0; i < allLines; ++i) {
			//Получаем очередную i-ю строку в документе
            const lineText = document.lineAt(i).text.trimStart();

            if (lineText.includes("#include <time.h>"))
                includeTime = true;

			if (lineText.includes("#include <cstdio>"))
				includeCSTDIO = true;

			//Сравниваю начинается ли строка с маски
			const resultStart = regexStart.exec(lineText);
			const resultEnd = regexEnd.exec(lineText);

			if (resultStart) {
				let val = parseInt(resultStart[1]);
				if (val in timers) {
					//Если попались два одинаковых стартовых таймера, то удаляем тот, который позже добавлен
					linesDelete.push(i);
				}
				else {
					//Иначе создаем создаем значение пары - false
					timers[val] = false;
				}
			}
			else if (resultEnd) {
				let val = parseInt(resultEnd[1]);
				if (val in timers) {
					//Если k-ый таймер end соот-т k-ому таймеру start, то пара есть (true)
					timers[val] = true
				}
				else {
					//Иначе удаляем строку
					linesDelete.push(i);
				}
			}
			
        }

		//Запускаем операцию редактирования активного документа
		editor.edit(editBuilder => {
			//Если в документе нет подключенной библиотеки time.h, то подключить ее
			if (!includeTime)
				editBuilder.insert(new vscode.Position(0, 0), '#include <time.h>\n');

			//Если в документе нет подключенной библиотеки cstdio, то подключить ее
			if (!includeCSTDIO)
				editBuilder.insert(new vscode.Position(0, 0), '#include <cstdio>\n');

			//Удаляем все повторяющиеся таймеры
			for (let i = 0; i < linesDelete.length; ++i) 
				editBuilder.delete(document.lineAt(linesDelete[i]).range);
		}).then(success => {
			//Сортируем ключи словаря timers по возрастанию
			let keys = Object.keys(timers).map(x => parseInt(x)).sort((a, b) => a - b);
			let end = -1;

			//Находим первый k-ый таймер старта без пары
			for (let i = 0; i < keys.length; ++i) {
				if (!timers[keys[i]]) {
					end = keys[i];
					break;
				}
			}

			//Если есть какой-то k-ый таймер start, но нет k-ого таймера end, то создаем пару
			if (end != -1) {
				editor.insertSnippet(new vscode.SnippetString(`\nclock_t ${maskEnd}${end} = clock();
printf("TIMER_${end}: %f\\n", (double)(${maskEnd}${end} - ${maskStart}${end}) / CLOCKS_PER_SEC);\n`));

			//Если все таймеры имеют пары, то добавить новый k-ый таймер старта
			} else if (end == -1 && keys.length > 0){
				let index = keys[keys.length - 1] + 1;

				editor.insertSnippet(new vscode.SnippetString(`\nclock_t ${maskStart}${index} = clock();\n`));
			
			//Если нет ни одного таймера, то добавить таймер старта номер 1
			} else {
				editor.insertSnippet(new vscode.SnippetString(`\nclock_t ${maskStart}1 = clock();\n`));
			}
		});
    });

    context.subscriptions.push(disposable);	
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
