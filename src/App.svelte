<script>
	import { element } from "svelte/internal";

	import PageTemplate from "~/components/PageTemplate.svelte";
	// import logo from "~/images/svelte-logo-horizontal.svg";
	import TodoInput from "~/components/TodoInput.svelte";
	import TodoList from "~/components/TodoList.svelte";
	export let name = "default";

	let title = "TODO LIST";
	let todoValue = "";
	let todos = [
		{
			id: 0,
			content: "첫 번째 할일",
			done: false,
		},
		{
			id: 1,
			content: "두 번째 할일",
			done: true,
		},
		{
			id: 2,
			content: "세 번째 할일",
			done: false,
		},
	];

	let todoId = todos[todos.length - 1]["id"];

	let handleKeyup = (e) => {
		todoValue = e.target.value; // keyup 이벤트 발생시 todoValue 값을 업데이트
		if (e.keyCode === 13) {
			handleInsert();
		}
	};

	let handleRemove = (id) => {
		todos = todos.filter((ele) => ele.id !== id);
	};
	let handleInsert = () => {
		if (todoValue) {
			const newTodo = {
				id: ++todoId,
				content: todoValue,
				done: false,
			};
			todos[todos.length] = newTodo;
			todoValue = "";
		} else {
			alert("내용을 입력해 주세요.");
		}
	};
	let handleCheck = (id, done) => {
		const index = todos.findIndex((todo) => todo.id === id);
		todos[index]["done"] = !done;
	};

	let handleModify = (e, id) => {
		const element = e.target;
		const index = todos.findIndex((todo) => todo.id === id);
		const modify = function () {
			element.removeAttribute("contenteditable");
			todos[index]["content"] = element.textContent;
			element.removeEventListener("blur", modify, false);
		};
		element.setAttribute("contenteditable", true);
		element.focus();
		element.addEventListener("blur", modify, false);
	};
</script>

<style lang="scss" src="./styles/global.scss">
</style>

<PageTemplate {title} {name}>
	<TodoInput {todoValue} {handleKeyup} {handleInsert} />
	<TodoList {todos} {handleRemove} {handleCheck} {handleModify} />
</PageTemplate>
