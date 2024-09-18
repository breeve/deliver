package command

import (
	"errors"
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type cmdModel struct {
	// command
	current *cobra.Command
	root    *cobra.Command

	// view
	input           textinput.Model
	display         viewport.Model
	displayLenMax   int
	displayCache    []string
	displayCacheMax int

	// console
	err   error
	infos []string
}

func InitCmdModel() (*cmdModel, error) {
	rootCmd, err := InitCommand()
	if err != nil {
		logrus.Errorf("init command model fail, init command error:%s", err)
		return nil, err
	}
	currentCmd := rootCmd

	input := textinput.New()
	input.Prompt = ">"
	input.Focus()

	display := viewport.New(0, 1)
	defaultCmdDisplay := lipgloss.NewStyle().Foreground(lipgloss.Color("5")).Render(cmdPrefix(currentCmd))
	displatCache := []string{defaultCmdDisplay}
	display.SetContent(strings.Join(displatCache, "\n"))
	display.GotoBottom()
	display.Style = lipgloss.NewStyle().Border(lipgloss.RoundedBorder())

	return &cmdModel{
		current:         currentCmd,
		root:            rootCmd,
		input:           input,
		display:         display,
		displayCache:    displatCache,
		displayLenMax:   10,
		displayCacheMax: 30000,
		err:             nil,
		infos:           []string{},
	}, nil
}

func cmdPrefix(cmd *cobra.Command) string {
	return fmt.Sprintf("%s: ", cmd.CommandPath())
}

func (m *cmdModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m *cmdModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var (
		input   tea.Cmd
		display tea.Cmd
	)

	m.input, input = m.input.Update(msg)
	m.display, display = m.display.Update(msg)

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			return m, tea.Quit
		case tea.KeyTab:
			// 自动补全
		case tea.KeyEnter:
			m.consoleOutRest()
			switch m.input.Value() {
			case "?":
				// help
			default:
				args := m.input.Value()
				outputs, err := m.runCmd(args)
				if err != nil {
					logrus.Errorf("update error:%s", err)
					m.consoleError(err.Error())
					return m, tea.Batch(input, display)
				}
				m.displayFlush(args, outputs)
			}
		}
	case tea.WindowSizeMsg:
		m.display.Height = m.displayLenMax + 2 // 因为边框占了两行
		m.display.Width = msg.Width
		m.display.SetYOffset(-1)
		m.display.Style.Width(msg.Width)
	case error:
		logrus.Errorf("update error:%s", msg.Error())
		return m, tea.Batch(input, display)
	}

	return m, tea.Batch(input, display)
}

func (m *cmdModel) View() string {
	viewFmt := ""
	if len(m.infos) != 0 {
		viewFmt += fmt.Sprintf("INFO:\n%s\n", strings.Join(m.infos, "\n"))
	}

	if m.err != nil {
		viewFmt += fmt.Sprintf("ERROR:\n%s\n", m.err)
	}

	viewFmt += "%s\n%s\n"

	return fmt.Sprintf(
		viewFmt,
		m.display.View(),
		m.input.View(),
	)
}

func (m *cmdModel) runCmd(argStr string) ([]string, error) {
	return strings.Fields(argStr), nil
}

func (m *cmdModel) displayFlush(args string, outputs []string) {
	m.displayCache = append(m.displayCache, lipgloss.NewStyle().Foreground(lipgloss.Color("5")).Render(cmdPrefix(m.current))+args)
	m.displayCache = append(m.displayCache, outputs...)
	if len(m.displayCache) > m.displayCacheMax {
		m.displayCache = m.displayCache[len(m.displayCache)-m.displayCacheMax:]
	}
	m.consoleInfo(fmt.Sprintf("cache:len:%d", len(m.displayCache)))

	m.display.SetContent(strings.Join(m.displayCache, "\n"))
	m.display.GotoBottom()

	m.input.Reset()
}

func (m *cmdModel) consoleInfo(info string) {
	m.infos = append(m.infos, info)
}

func (m *cmdModel) consoleError(err string) {
	m.err = errors.New(err)
}

func (m *cmdModel) consoleOutRest() {
	m.infos = []string{}
	m.err = nil
}
