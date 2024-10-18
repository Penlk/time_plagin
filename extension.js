const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */

//include <time.h>
//clock() / CLOCKS_PER_SEC
//TIMER_PLAGIN_START_1 = clock();
//TIMER_PLAGIN_END_1 = clock();
//printf("TIMER_1: %d seconds have passed, (TIMER_PLAGIN_END_1 - TIMER_PLAGIN_1) / CLOCKS_PER_SEC);
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.timer', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
			return;

		const document = editor.document;
		const allLines = document.lineCount;
		const maskStart = "int TIMER_PLAGIN_START_";
		const maskEnd = "int TIMER_PLAGIN_END_";

		let include = false;
		let timers = {};
		let linesDelete = [];

		const regexStart = /^int TIMER_PLAGIN_START_(\d+) = clock\(\);$/;
		const regexEnd = /^int TIMER_PLAGIN_END_(\d+) = clock\(\);$/;

		for (let i = 0; i < allLines; ++i) {
            const lineText = document.lineAt(i).text;

            if (lineText.includes("#include <time.h>"))
                include = true;

			const resultStart = regexStart.exec(lineText);
			const resultEnd = regexEnd.exec(lineText);

			if (resultStart) {
				let val = parseInt(resultStart[1]);
				if (val in timers) {
					linesDelete.push(i + 1);
				}
				else {
					timers[val] = false;
				}
			}
			else if (resultEnd) {
				let val = parseInt(resultEnd[1]);
				if (val in timers) {
					timers[val] = true
				}
				else {
					linesDelete.push(i + 1);
				}
			}
			
        }

		editor.edit(editBuilder => {

			if (!include) {
				editBuilder.insert(new vscode.Position(0, 0), '#include <time.h>\n');
			}

			for (let i = 0; i < linesDelete.length; ++i) {
				editBuilder.delete(document.lineAt(linesDelete[i]).range);
			}

			let keys = Object.keys(timers).sort();
			let end = -1;

			for (let i = 0; i < keys.length; ++i) {
				if (!timers[keys[i]]) {
					end = parseInt(keys[i]);
					break;
				}
			}

			if (end != -1) {
				editor.insertSnippet(new vscode.SnippetString("\nint TIMER_PLAGIN_END_${end} = clock();\n"));
			}

			if (keys.length === 0) {
				editor.insertSnippet(new vscode.SnippetString("\nint TIMER_PLAGIN_START_1 = clock();\n"));
			}
		});

		// editor.edit(editBuilder => {
		// 	// Добавляем #include, если он не найден
		// 	if (!include) {
		// 		editBuilder.insert(new vscode.Position(0, 0), '#include <time.h>\n');
		// 	}
			
		// 	// Удаляем строки в обратном порядке
		// 	for (let i = 1; i >= 1; --i) {
		// 		// const lineIndex = linesDelete[i];
		// 		if (true) { // Проверяем, что индекс валиден
		// 			editBuilder.delete(document.lineAt(1).range);
		// 		}
		// 	}
		// }).then(success => {
		// 	if (success) {
		let keys = Object.keys(timers).sort();
		if (keys.length === 0) {
			editor.insertSnippet(new vscode.SnippetString("\nint TIMER_PLAGIN_START_1 = clock();\n"));
		}
		// 	}
		// }).catch(error => {
		// 	console.error("Ошибка в редакторе: ", error);
		// });
		

		// if (!include)
		// 	editor.edit(editBuilder => {
		// 		editBuilder.insert(new vscode.Position(0, 0), '#include <time.h>\n');
		// 	});


		// let keys = Object.keys(timers).sort();

		// if (keys.length == 0) {
		// 	editor.insertSnippet(new vscode.SnippetString("\nint TIMER_PLAGIN_START_1 = clock();\n"));
		// 	return;
		// }
		
		// let indexEnd = -1;

		// keys.unshift(-1);

		// for (let i = 0; i < keys.length; ++i) {
		// 	if (!timers[keys[i]]) {
		// 		indexEnd = keys[i];
		// 	}
		// }
        
    });

    context.subscriptions.push(disposable);	
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
