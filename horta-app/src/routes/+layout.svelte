<script lang="ts">
let { children } = $props();
</script>
<nav>
<a href="/">Home</a>
<a href="/abouttheproject">About the Project</a>
<a href="/extrainformation">Extra Information</a>
</nav>
{@render children()}