<script>
	import TodoItem from "~/components/TodoItem.svelte";
	export let todos;
	export let handleCheck;
	export let handleRemove;
	export let handleModify;
</script>

<style lang="scss">
	ul {
		padding: 0.9rem 0 1.2rem;
	}
</style>

<ul>
	{#each todos as todo, index}
		<TodoItem {index} {todo} {handleRemove} {handleCheck} {handleModify} />
	{:else}
		<p>No tasks today!</p>
	{/each}
	<!-- <TodoItem /> -->
</ul>
