
import styles from './x-textarea.css?inline';

  class XTextarea extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      const wrapper = document.createElement('div');
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';

      const textarea = document.createElement('textarea');
      textarea.setAttribute('id', 'editor');

      const preview = document.createElement('div');
      preview.setAttribute('id', 'preview');

      // Heading level dropdown
      const headingSelect = document.createElement('select');
      headingSelect.title = 'Set Heading Level';
      ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].forEach((label, i) => {
        const option = document.createElement('option');
        option.value = i === 0 ? '0' : `${i}`;
        option.textContent = label;
        headingSelect.appendChild(option);
      });
      headingSelect.addEventListener('change', () => {
        this.setHeadingLevel(parseInt(headingSelect.value));
        this.updatePreview();
      });
      toolbar.appendChild(headingSelect);

      const buttons = [
        { icon: '<strong>B</strong>', wrapper: '!!', tooltip: 'Bold (Ctrl+B / Cmd+B)' },
        { icon: '<em>I</em>', wrapper: '~~', tooltip: 'Italic (Ctrl+I / Cmd+I)' },
        { icon: '<u>U</u>', wrapper: '__', tooltip: 'Underline (Ctrl+U / Cmd+U)' },
        { icon: '<s>S</s>', wrapper: '--', tooltip: 'Strikethrough (Ctrl+Shift+S)' },
        { icon: '<code>x</code>', wrapper: '``', tooltip: 'Strikethrough (Ctrl+Shift+S)' },
        { icon: '<s>S</s>', wrapper: '--', tooltip: 'Strikethrough (Ctrl+Shift+S)' },
        { icon: '<s>S</s>', wrapper: '--', tooltip: 'Strikethrough (Ctrl+Shift+S)' },
        { icon: '<s>S</s>', wrapper: '--', tooltip: 'Strikethrough (Ctrl+Shift+S)' }
      ];

      buttons.forEach(({ icon, wrapper, tooltip }) => {
        const button = document.createElement('button');
        button.innerHTML = icon;
        button.title = tooltip;
        button.addEventListener('click', () => {
          this.wrapSelection(wrapper);
          this.updatePreview();
        });
        toolbar.appendChild(button);
      });

      wrapper.appendChild(toolbar);
      wrapper.appendChild(textarea);
      wrapper.appendChild(preview);

      const fontAwesomeLink = document.createElement('link');

      const style = document.createElement('style');
      style.textContent = styles;

      shadow.appendChild(fontAwesomeLink);
      shadow.appendChild(style);
      shadow.appendChild(wrapper);

      textarea.addEventListener('input', () => this.updatePreview());

      textarea.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

        if (ctrlKey && !e.altKey) {
          switch (e.key.toLowerCase()) {
            case 'b': e.preventDefault(); this.wrapSelection('!!'); break;
            case 'i': e.preventDefault(); this.wrapSelection('~~'); break;
            case 'u': e.preventDefault(); this.wrapSelection('__'); break;
            case 's': if (e.shiftKey) { e.preventDefault(); this.wrapSelection('--'); } break;
          }
          this.updatePreview();
        }
      });
    }

    wrapSelection(wrapperChars) {
      const textarea = this.shadowRoot.getElementById('editor');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);

      textarea.value = `${before}${wrapperChars}${selectedText}${wrapperChars}${after}`;
      textarea.focus();
      textarea.setSelectionRange(start + wrapperChars.length, end + wrapperChars.length);
    }

    setHeadingLevel(level) {
      const textarea = this.shadowRoot.getElementById('editor');
      const cursorPos = textarea.selectionStart;
      const lines = textarea.value.split('\n');
      let charCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = charCount;
        const lineEnd = charCount + line.length;

        if (cursorPos >= lineStart && cursorPos <= lineEnd) {
          const match = line.match(/^(=+)\s*(.*)/);
          const text = match ? match[2] : line;

          if (level === 0) {
            lines[i] = text; // remove heading
          } else {
            lines[i] = '='.repeat(level) + ' ' + text;
          }
          break;
        }

        charCount += line.length + 1;
      }

      textarea.value = lines.join('\n');
      textarea.focus();
    }

    updatePreview() {
      const textarea = this.shadowRoot.getElementById('editor');
      const preview = this.shadowRoot.getElementById('preview');
      let content = textarea.value;

      content = content
        .split('\n')
        .map(line => {
          const headingMatch = line.match(/^(=+)\s*(.*)/);
          if (headingMatch) {
            const level = Math.min(headingMatch[1].length, 6); // h2 to h6
            const text = headingMatch[2].trim();
            return `<h${level}><span class="heading-badge">H${level}</span> ${text}</h${level}>`;
          }
          return line
            .replace(/!!(.*?)!!/g, '<strong>$1</strong>')
            .replace(/\/\/(.*?)\/\//g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/--(.*?)--/g, '<s>$1</s>');
        })
        .join('<br>');

      preview.innerHTML = content;
    }
  }

  customElements.define('x-textarea', XTextarea);
