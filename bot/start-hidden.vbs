' Автозапуск бота заказов «Носи носки» без окна: node bot\bot.mjs, вывод — в bot\bot.log
' Ярлык на этот файл лежит в автозагрузке Windows (shell:startup)
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = dir
sh.Run "cmd /c node bot.mjs >> bot.log 2>&1", 0, False
