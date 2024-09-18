package command

import (
	"github.com/spf13/cobra"
)

type Command struct {
	Cmd *cobra.Command
}

func (c *Command) Execute(argOrigin string) (stdOut string, stdErr string, err error) {
	return "", "", nil
}

func (c *Command) CommandPath() string {
	return c.Cmd.CommandPath()
}
