<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Define leaf-page metadata in each route's `head` option so TanStack Router applies page-specific titles and descriptions.
- Security climate (postures, activity classification) is derived in code from approved headlines and alerts (src/lib/climate.ts); the database schema stays unchanged, so the rubric lives in one tested module.
