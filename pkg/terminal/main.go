package main

import (
	tea "github.com/charmbracelet/bubbletea"
	"github.com/sirupsen/logrus"
)

func main() {
	m, err := initCmdModel()
	if err != nil {
		logrus.Fatalf("init cmd model err:%s", err)
		return
	}
	//p := tea.NewProgram(m, tea.WithAltScreen())
	p := tea.NewProgram(m)
	if _, err := p.Run(); err != nil {
		logrus.Fatalf("app run err:%s", err)
	}
}
