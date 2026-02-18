import { defineConfig } from 'vite'

export default defineConfig({
  // リポジトリ名が「ff14-kanpe」なら '/ff14-kanpe/' と書く
  // どこのURLでも動くようにするには './' (ドットあり) が一番安全です
  base: './', 
})