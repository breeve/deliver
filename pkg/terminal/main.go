package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

func main() {
	p := tea.NewProgram(initialModel())

	if _, err := p.Run(); err != nil {
		log.Fatal(err)
	}
}

type (
	errMsg error
)

type model struct {
	viewPort    viewport.Model
	messages    []string
	textInput   textinput.Model
	senderStyle lipgloss.Style
	perfix      string
	err         error
}

func initialModel() model {
	vp := viewport.New(0, 1)
	vp.SetContent(strings.Join([]string{lipgloss.NewStyle().Foreground(lipgloss.Color("5")).Render("default: ")}, "\n"))
	vp.GotoBottom()

	ti := textinput.New()
	ti.Prompt = ":"
	ti.Focus()

	return model{
		textInput:   ti,
		messages:    []string{},
		viewPort:    vp,
		senderStyle: lipgloss.NewStyle().Foreground(lipgloss.Color("5")),
		perfix:      "default: ",
		err:         nil,
	}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var (
		tiCmd tea.Cmd
		vpCmd tea.Cmd
	)

	m.textInput, tiCmd = m.textInput.Update(msg)
	m.viewPort, vpCmd = m.viewPort.Update(msg)

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			fmt.Println(m.textInput.Value())
			return m, tea.Quit
		case tea.KeyTab:
			showLine := m.senderStyle.Render(m.perfix) + "help msg xxx"

			m.messages = append(m.messages, showLine)
			m.viewPort.SetContent(strings.Join(m.messages, "\n"))
			m.textInput.Reset()
			m.viewPort.GotoBottom()
		case tea.KeyEnter:
			switch m.textInput.Value() {
			case "config":
				m.perfix += m.textInput.Value() + ": "
				showLine := m.senderStyle.Render(m.perfix)

				m.messages = append(m.messages, showLine)
				m.viewPort.SetContent(strings.Join(m.messages, "\n"))
				m.textInput.Reset()
				m.viewPort.GotoBottom()
			case "show interface":
				showLine := m.senderStyle.Render(m.perfix) + m.textInput.Value()
				text := []string{"1", "2", "3"}

				m.messages = append(m.messages, showLine)
				m.messages = append(m.messages, text...)
				m.viewPort.SetContent(strings.Join(m.messages, "\n"))
				m.textInput.Reset()
				m.viewPort.GotoBottom()
			default:
				if len(m.textInput.Value()) > 0 {
					showLine := m.senderStyle.Render(m.perfix) + "help msg xxx"

					m.messages = append(m.messages, showLine)
					m.viewPort.SetContent(strings.Join(m.messages, "\n"))
					m.textInput.Reset()
					m.viewPort.GotoBottom()
				} else {
					showLine := m.senderStyle.Render(m.perfix)

					m.messages = append(m.messages, showLine)
					m.viewPort.SetContent(strings.Join(m.messages, "\n"))
					m.textInput.Reset()
					m.viewPort.GotoBottom()
				}
			}
		}
	case tea.WindowSizeMsg:
		m.viewPort.Height = msg.Height - 5
	case errMsg:
		m.err = msg
		return m, nil
	}

	return m, tea.Batch(tiCmd, vpCmd)
}

func (m model) View() string {
	return fmt.Sprintf(
		"%s\n\n%s",
		m.viewPort.View(),
		m.textInput.View(),
	) + "\n\n"
}
