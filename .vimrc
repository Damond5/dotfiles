if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall --sync | source $MYVIMRC
endif

" Specify a directory for plugins
" - Avoid using standard Vim directory names like 'plugin'
call plug#begin('~/.vim/plugged')

" Make sure you use single quotes
" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
Plug 'tpope/vim-sensible'

Plug 'de-vri-es/vim-urscript'

Plug 'altercation/vim-colors-solarized'
Plug 'octol/vim-cpp-enhanced-highlight'
Plug 'vim-airline/vim-airline'

Plug 'yggdroot/indentline'
Plug 'myusuf3/numbers.vim'

" Plug 'valloric/youcompleteme'
" Plug 'rdnetto/YCM-Generator', { 'branch': 'stable' }
Plug 'neoclide/coc.nvim', {'branch': 'release'}

Plug 'sirver/ultisnips'
Plug 'honza/vim-snippets'

Plug 'raimondi/delimitmate'
" Plug 'scrooloose/nerdcommenter'

Plug 'tpope/vim-fugitive'
Plug 'idanarye/vim-merginal'
Plug 'airblade/vim-gitgutter'
Plug 'junegunn/gv.vim'

" On-demand loading
Plug 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Plug 'Xuyuanp/nerdtree-git-plugin'


" Initialize plugin system
call plug#end()


syntax enable
set t_Co=256
set background=dark
colorscheme solarized
highlight Normal ctermbg=NONE
highlight nonText ctermbg=NONE
setlocal sw=4
setlocal ts=4

source $VIMRUNTIME/macros/matchit.vim
" set autoindent
" set smartindent
"set cindent
filetype plugin indent on
"filetype indent on
"filetype plugin on

"set list
"set listchars=tab:\|\ 

"autocmd BufEnter *.m    compiler mlint

set number
"highlight LineNr ctermfg=#839496 ctermbg=base03
highlight clear LineNr
highlight clear SignColumn

set cursorline
set breakindent

set tabstop=2
set shiftwidth=2
set expandtab

autocmd FileType html setlocal noexpandtab
autocmd FileType urscript setlocal noexpandtab
autocmd FileType java setlocal noexpandtab
autocmd FileType xml setlocal noexpandtab
autocmd FileType rust setlocal tabstop=2 shiftwidth=2 expandtab

set encoding=utf-8

" Having longer updatetime (default is 4000 ms = 4 s) leads to noticeable
" delays and poor user experience.
set updatetime=300
" Always show the signcolumn, otherwise it would shift the text each time
" diagnostics appear/become resolved.
set signcolumn=yes
" Don't pass messages to |ins-completion-menu|.
" set shortmess+=c

set shell=/bin/fish

let mapleader = ","


" SNIPPETS
" Trigger configuration. Do not use <tab> if you use https://github.com/Valloric/YouCompleteMe.
let g:UltiSnipsExpandTrigger="<c-l>"
let g:UltiSnipsJumpForwardTrigger="<c-j>"
let g:UltiSnipsJumpBackwardTrigger="<c-k>"
" If you want :UltiSnipsEdit to split your window.
let g:UltiSnipsEditSplit="vertical"

" set .aubo to lua filetype
augroup filetypedetect
    au BufRead,BufNewFile *.aubo setfiletype lua
    " au BufRead,BufNewFile *.aubo let g:ale_python_autopep8_options='--ignore=E24,W503,E101,E11,E121'
    " associate *.foo with php filetype
    au BufRead,BufNewFile *.cocrc setfiletype vim
    au BufRead,BufNewFile *.pro setfiletype make
    au BufRead,BufNewFile *.pri setfiletype make
augroup END

" " YOUCOMEPLETEME
" let g:ycm_autoclose_preview_window_after_completion = 1
" " let g:ycm_autoclose_preview_window_after_insertion = 1
" let g:ycm_always_populate_location_list = 1
" let g:ycm_filetype_blacklist = {
"       \ 'java': 1,
"       \ 'tagbar': 1,
"       \ 'notes': 1,
"       \ 'markdown': 1,
"       \ 'netrw': 1,
"       \ 'unite': 1,
"       \ 'text': 1,
"       \ 'vimwiki': 1,
"       \ 'pandoc': 1,
"       \ 'infolog': 1,
"       \ 'leaderf': 1,
"       \ 'mail': 1
"       \}

" COC
source /home/nikv/.cocrc

" NERDTREE
autocmd StdinReadPre * let s:std_in=1
autocmd VimEnter * if argc() == 0 && !exists("s:std_in") && v:this_session == "" | exe 'NERDTree' | exe 'term' | wincmd x | endif
autocmd VimEnter * if argc() == 1 && isdirectory(argv()[0]) && !exists("s:std_in") | exe 'NERDTree' argv()[0] | wincmd p | ene | exe 'cd '.argv()[0] | endif

" MERGINAL
" bugs out, opening merginal when pressing enter in some situations
" map <c-m> :Merginal <CR>

" CPP ENHANCED HIGHLIGHT
let g:cpp_class_scope_highlight = 1
let g:cpp_member_variable_highlight = 1
let g:cpp_class_decl_highlight = 1

" GITGUTTER
let g:gitgutter_sign_priority = 0
